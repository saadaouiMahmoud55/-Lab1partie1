// src/app/notes.tsx
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/errors';
import { createNote, deleteNote, listNotes, updateNote } from '../services/notes';
import type { Note, NoteDraft } from '../types';

export default function NotesScreen() {
  // The route is protected, so a user always exists on this screen
  const userId = useAuth().user!.$id;

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Note | 'new' | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setNotes(await listNotes(userId));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      setNotes(await listNotes(userId));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setRefreshing(false);
    }
  };

  const save = async (draft: NoteDraft) => {
    try {
      if (editing === 'new') {
        const created = await createNote(userId, draft);
        setNotes((prev) => [created, ...prev]);
      } else if (editing) {
        const updated = await updateNote(editing.id, draft);
        setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      }
      setEditing(null);
    } catch (e) {
      Alert.alert('Error', errorMessage(e));
    }
  };

  const remove = (note: Note) =>
    Alert.alert('Delete note', `Delete "${note.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteNote(note.id);
            setNotes((prev) => prev.filter((n) => n.id !== note.id));
          } catch (e) {
            Alert.alert('Error', errorMessage(e));
          }
        },
      },
    ]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Pressable style={styles.button} onPress={load}>
          <Text style={styles.buttonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={notes.length === 0 ? styles.emptyList : undefined}
        renderItem={({ item }) => (
          <Pressable
            style={styles.item}
            onPress={() => setEditing(item)}
            onLongPress={() => remove(item)}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            {item.content ? <Text style={styles.itemText}>{item.content}</Text> : null}
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState onCreate={() => setEditing('new')} />}
      />

      <Pressable style={styles.fab} onPress={() => setEditing('new')}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      {editing !== null && (
        <NoteEditor
          note={editing === 'new' ? null : editing}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      )}
    </View>
  );
}

type EditorProps = {
  note: Note | null;
  onSave: (draft: NoteDraft) => void;
  onCancel: () => void;
};

function NoteEditor({ note, onSave, onCancel }: EditorProps) {
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{note ? 'Edit note' : 'New note'}</Text>
          <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Content"
            value={content}
            onChangeText={setContent}
            multiline
          />
          <View style={styles.row}>
            <Pressable onPress={onCancel}>
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.button}
              onPress={() => title.trim() && onSave({ title: title.trim(), content: content.trim() })}>
              <Text style={styles.buttonText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#fff' },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  error: { color: '#c0392b' },
  item: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ddd' },
  itemTitle: { fontSize: 17, fontWeight: 'bold' },
  itemText: { color: '#60646c', marginTop: 4 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { color: '#fff', fontSize: 30, lineHeight: 34 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', padding: 20, gap: 12, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  sheetTitle: { fontSize: 20, fontWeight: 'bold' },
  input: { backgroundColor: '#f0f0f3', borderRadius: 8, padding: 12, fontSize: 16 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16 },
  cancel: { color: '#60646c', fontSize: 16 },
  button: { backgroundColor: '#208AEF', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});