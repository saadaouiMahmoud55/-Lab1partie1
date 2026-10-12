import 'package:appwrite/appwrite.dart';

import '../config/app_config.dart';

final Account account = Account(client);

final Client client = Client()
    .setEndpoint(AppConfig.endpoint)
    .setProject(AppConfig.projectId);
final TablesDB tablesDB = TablesDB(client);