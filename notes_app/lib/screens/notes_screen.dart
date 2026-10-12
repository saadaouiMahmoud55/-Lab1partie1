// lib/screens/notes_screen.dart
import 'package:appwrite/appwrite.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../models/note.dart';
import '../services/notes_service.dart';
import '../widgets/empty_state.dart';

class NotesScreen extends StatefulWidget {
  const NotesScreen({super.key});

  @override
  State<NotesScreen> createState() => _NotesScreenState();
}

class _NotesScreenState extends State<NotesScreen> {
  // The route is protected, so a user always exists on this screen
  late final String _userId;

  List<Note> _notes = [];
  bool _loading = true;
  String? _error;

  @override
  Widget build(BuildContext context) {
    Widget body;
    if (_loading) {
      body = const Center(child: CircularProgressIndicator());
    } else if (_error != null) {
      body = Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          spacing: 12,
          children: [
            Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            FilledButton(onPressed: _load, child: const Text('Retry')),
          ],
        ),
      );
    } else {
      body = RefreshIndicator(
        onRefresh: () => _load(showSpinner: false),
        child: _notes.isEmpty
            ? ListView(children: [EmptyState(onCreate: _add)])
            : ListView.builder(
                itemCount: _notes.length,
                itemBuilder: (context, i) {
                  final note = _notes[i];
                  return ListTile(
                    title: Text(note.title),
                    subtitle: note.content.isEmpty ? null : Text(note.content),
                    onTap: () => _edit(note),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete_outline),
                      onPressed: () => _delete(note),
                    ),
                  );
                },
              ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Notes'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/'),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _add,
        child: const Icon(Icons.add),
      ),
      body: body,
    );
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _add() async {
    final draft = await _askDraft();
    if (draft == null) return;
    try {
      final created = await notesService.create(_userId, draft);
      if (!mounted) return;
      setState(() => _notes = [created, ..._notes]);
    } catch (e) {
      _showError(e);
    }
  }

  Future<NoteDraft?> _askDraft({Note? note}) {
    final title = TextEditingController(text: note?.title ?? '');
    final content = TextEditingController(text: note?.content ?? '');
    return showDialog<NoteDraft>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(note == null ? 'New note' : 'Edit note'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          spacing: 12,
          children: [
            TextField(
              controller: title,
              autofocus: true,
              decoration: const InputDecoration(labelText: 'Title'),
            ),
            TextField(
              controller: content,
              maxLines: 4,
              decoration: const InputDecoration(labelText: 'Content'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              if (title.text.trim().isEmpty) return;
              Navigator.pop(
                context,
                (
                  title: title.text.trim(),
                  content: content.text.trim(),
                ),
              );
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  Future<void> _delete(Note note) async {
    try {
      await notesService.delete(note.id);
      if (!mounted) return;
      setState(() => _notes = _notes.where((n) => n.id != note.id).toList());
    } catch (e) {
      _showError(e);
    }
  }

  Future<void> _edit(Note note) async {
    final draft = await _askDraft(note: note);
    if (draft == null) return;
    try {
      final updated = await notesService.update(note.id, draft);
      if (!mounted) return;
      setState(() {
        _notes = [for (final n in _notes) n.id == updated.id ? updated : n];
      });
    } catch (e) {
      _showError(e);
    }
  }

  Future<void> _load({bool showSpinner = true}) async {
    if (showSpinner) setState(() => _loading = true);
    setState(() => _error = null);
    try {
      final notes = await notesService.list(_userId);
      if (!mounted) return;
      setState(() => _notes = notes);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = _message(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _message(Object e) =>
      e is AppwriteException ? (e.message ?? 'Something went wrong') : e.toString();

  void _showError(Object e) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_message(e))));
  }
}