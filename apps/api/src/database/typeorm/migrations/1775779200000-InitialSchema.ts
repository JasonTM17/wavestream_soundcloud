import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

const primaryUuidColumn = {
  name: 'id',
  type: 'uuid',
  isPrimary: true,
  generationStrategy: 'uuid' as const,
  default: 'uuid_generate_v4()',
};

const createdAtColumn = {
  name: 'createdAt',
  type: 'timestamp',
  default: 'now()',
};

const updatedAtColumn = {
  name: 'updatedAt',
  type: 'timestamp',
  default: 'now()',
};

const deletedAtColumn = {
  name: 'deletedAt',
  type: 'timestamp',
  isNullable: true,
};

export class InitialSchema1775779200000 implements MigrationInterface {
  name = 'InitialSchema1775779200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          primaryUuidColumn,
          createdAtColumn,
          updatedAtColumn,
          deletedAtColumn,
          { name: 'email', type: 'varchar', isUnique: true },
          { name: 'username', type: 'varchar', isUnique: true },
          { name: 'passwordHash', type: 'varchar' },
          { name: 'displayName', type: 'varchar' },
          { name: 'role', type: 'varchar', default: "'listener'" },
          { name: 'isVerified', type: 'boolean', default: false },
          { name: 'followerCount', type: 'int', default: 0 },
          { name: 'followingCount', type: 'int', default: 0 },
          { name: 'trackCount', type: 'int', default: 0 },
          { name: 'playlistCount', type: 'int', default: 0 },
          { name: 'lastLoginAt', type: 'timestamp', isNullable: true },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'genres',
        columns: [
          primaryUuidColumn,
          createdAtColumn,
          updatedAtColumn,
          { name: 'name', type: 'varchar', isUnique: true },
          { name: 'slug', type: 'varchar', isUnique: true },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'tags',
        columns: [
          primaryUuidColumn,
          createdAtColumn,
          updatedAtColumn,
          { name: 'name', type: 'varchar', isUnique: true },
          { name: 'slug', type: 'varchar', isUnique: true },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'profiles',
        columns: [
          primaryUuidColumn,
          createdAtColumn,
          updatedAtColumn,
          { name: 'userId', type: 'uuid', isUnique: true },
          { name: 'bio', type: 'text', isNullable: true },
          { name: 'avatarUrl', type: 'text', isNullable: true },
          { name: 'bannerUrl', type: 'text', isNullable: true },
          { name: 'websiteUrl', type: 'text', isNullable: true },
          {
            name: 'location',
            type: 'varchar',
            length: '120',
            isNullable: true,
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'tracks',
        columns: [
          primaryUuidColumn,
          createdAtColumn,
          updatedAtColumn,
          deletedAtColumn,
          { name: 'slug', type: 'varchar', isUnique: true },
          { name: 'artistId', type: 'uuid' },
          { name: 'title', type: 'varchar' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'coverUrl', type: 'text', isNullable: true },
          { name: 'duration', type: 'int', default: 0 },
          { name: 'privacy', type: 'varchar', default: "'public'" },
          { name: 'status', type: 'varchar', default: "'draft'" },
          { name: 'allowDownloads', type: 'boolean', default: true },
          { name: 'commentsEnabled', type: 'boolean', default: true },
          { name: 'playCount', type: 'int', default: 0 },
          { name: 'likeCount', type: 'int', default: 0 },
          { name: 'repostCount', type: 'int', default: 0 },
          { name: 'commentCount', type: 'int', default: 0 },
          { name: 'publishedAt', type: 'timestamp', isNullable: true },
          {
            name: 'hiddenReason',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          { name: 'genreId', type: 'uuid', isNullable: true },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['artistId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['genreId'],
            referencedTableName: 'genres',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'track_files',
        columns: [
          primaryUuidColumn,
          createdAtColumn,
          updatedAtColumn,
          { name: 'trackId', type: 'uuid', isUnique: true },
          { name: 'bucket', type: 'varchar' },
          { name: 'objectKey', type: 'varchar' },
          { name: 'originalName', type: 'varchar' },
          { name: 'mimeType', type: 'varchar' },
          { name: 'sizeBytes', type: 'bigint' },
          { name: 'durationSeconds', type: 'int' },
          { name: 'publicUrl', type: 'text', isNullable: true },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['trackId'],
            referencedTableName: 'tracks',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'track_tags',
        columns: [
          { name: 'trackId', type: 'uuid', isPrimary: true },
          { name: 'tagId', type: 'uuid', isPrimary: true },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['trackId'],
            referencedTableName: 'tracks',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['tagId'],
            referencedTableName: 'tags',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );
    await queryRunner.query('CREATE INDEX "IDX_track_tags_tagId" ON "track_tags" ("tagId")');

    await queryRunner.createTable(
      new Table({
        name: 'follows',
        columns: [
          primaryUuidColumn,
          createdAtColumn,
          updatedAtColumn,
          { name: 'followerId', type: 'uuid' },
          { name: 'followingId', type: 'uuid' },
        ],
        indices: [
          {
            name: 'IDX_follows_follower_following',
            columnNames: ['followerId', 'followingId'],
            isUnique: true,
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['followerId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['followingId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'playlists',
        columns: [
          primaryUuidColumn,
          createdAtColumn,
          updatedAtColumn,
          deletedAtColumn,
          { name: 'slug', type: 'varchar', isUnique: true },
          { name: 'ownerId', type: 'uuid' },
          { name: 'title', type: 'varchar' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'coverUrl', type: 'text', isNullable: true },
          { name: 'isPublic', type: 'boolean', default: true },
          { name: 'trackCount', type: 'int', default: 0 },
          { name: 'totalDuration', type: 'int', default: 0 },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['ownerId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'playlist_tracks',
        columns: [
          primaryUuidColumn,
          createdAtColumn,
          updatedAtColumn,
          { name: 'playlistId', type: 'uuid' },
          { name: 'trackId', type: 'uuid' },
          { name: 'position', type: 'int' },
        ],
        indices: [
          {
            name: 'IDX_playlist_tracks_playlist_track',
            columnNames: ['playlistId', 'trackId'],
            isUnique: true,
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['playlistId'],
            referencedTableName: 'playlists',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['trackId'],
            referencedTableName: 'tracks',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'comments',
        columns: [
          primaryUuidColumn,
          createdAtColumn,
          updatedAtColumn,
          deletedAtColumn,
          { name: 'userId', type: 'uuid' },
          { name: 'trackId', type: 'uuid' },
          { name: 'body', type: 'text' },
          { name: 'timestampSeconds', type: 'int', isNullable: true },
          { name: 'parentId', type: 'uuid', isNullable: true },
          { name: 'isHidden', type: 'boolean', default: false },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['trackId'],
            referencedTableName: 'tracks',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['parentId'],
            referencedTableName: 'comments',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'likes',
        columns: [
          primaryUuidColumn,
          createdAtColumn,
          updatedAtColumn,
          { name: 'userId', type: 'uuid' },
          { name: 'trackId', type: 'uuid' },
        ],
        indices: [
          {
            name: 'IDX_likes_user_track',
            columnNames: ['userId', 'trackId'],
            isUnique: true,
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['trackId'],
            referencedTableName: 'tracks',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'reposts',
        columns: [
          primaryUuidColumn,
          createdAtColumn,
          updatedAtColumn,
          { name: 'userId', type: 'uuid' },
          { name: 'trackId', type: 'uuid' },
        ],
        indices: [
          {
            name: 'IDX_reposts_user_track',
            columnNames: ['userId', 'trackId'],
            isUnique: true,
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['trackId'],
            referencedTableName: 'tracks',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'reports',
        columns: [
          primaryUuidColumn,
          createdAtColumn,
          updatedAtColumn,
          { name: 'reporterId', type: 'uuid' },
          { name: 'reportableType', type: 'varchar' },
          { name: 'reportableId', type: 'varchar' },
          { name: 'reason', type: 'varchar', length: '120' },
          { name: 'details', type: 'text', isNullable: true },
          { name: 'status', type: 'varchar', default: "'pending'" },
          { name: 'resolvedById', type: 'uuid', isNullable: true },
          { name: 'resolvedAt', type: 'timestamp', isNullable: true },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['reporterId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['resolvedById'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'refresh_tokens',
        columns: [
          primaryUuidColumn,
          createdAtColumn,
          updatedAtColumn,
          { name: 'userId', type: 'uuid' },
          { name: 'tokenHash', type: 'text' },
          { name: 'expiresAt', type: 'timestamp' },
          { name: 'revokedAt', type: 'timestamp', isNullable: true },
          {
            name: 'userAgent',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '120',
            isNullable: true,
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'password_reset_tokens',
        columns: [
          primaryUuidColumn,
          createdAtColumn,
          updatedAtColumn,
          { name: 'userId', type: 'uuid' },
          { name: 'tokenHash', type: 'text' },
          { name: 'expiresAt', type: 'timestamp' },
          { name: 'usedAt', type: 'timestamp', isNullable: true },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'play_events',
        columns: [
          primaryUuidColumn,
          createdAtColumn,
          updatedAtColumn,
          { name: 'trackId', type: 'uuid' },
          { name: 'userId', type: 'uuid', isNullable: true },
          { name: 'durationListened', type: 'int', default: 0 },
          {
            name: 'source',
            type: 'varchar',
            length: '50',
            default: "'player'",
          },
          { name: 'playedAt', type: 'timestamp' },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['trackId'],
            referencedTableName: 'tracks',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'listening_history',
        columns: [
          primaryUuidColumn,
          createdAtColumn,
          updatedAtColumn,
          { name: 'userId', type: 'uuid' },
          { name: 'trackId', type: 'uuid' },
          { name: 'playedAt', type: 'timestamp' },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['trackId'],
            referencedTableName: 'tracks',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'notifications',
        columns: [
          primaryUuidColumn,
          createdAtColumn,
          updatedAtColumn,
          { name: 'userId', type: 'uuid' },
          { name: 'type', type: 'varchar' },
          { name: 'data', type: 'text', isNullable: true },
          { name: 'read', type: 'boolean', default: false },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          primaryUuidColumn,
          createdAtColumn,
          updatedAtColumn,
          { name: 'adminId', type: 'uuid' },
          { name: 'action', type: 'varchar' },
          { name: 'entityType', type: 'varchar', length: '80' },
          { name: 'entityId', type: 'varchar', isNullable: true },
          { name: 'details', type: 'text', isNullable: true },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['adminId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_logs', true);
    await queryRunner.dropTable('notifications', true);
    await queryRunner.dropTable('listening_history', true);
    await queryRunner.dropTable('play_events', true);
    await queryRunner.dropTable('password_reset_tokens', true);
    await queryRunner.dropTable('refresh_tokens', true);
    await queryRunner.dropTable('reports', true);
    await queryRunner.dropTable('reposts', true);
    await queryRunner.dropTable('likes', true);
    await queryRunner.dropTable('comments', true);
    await queryRunner.dropTable('playlist_tracks', true);
    await queryRunner.dropTable('playlists', true);
    await queryRunner.dropTable('follows', true);
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_track_tags_tagId"');
    await queryRunner.dropTable('track_tags', true);
    await queryRunner.dropTable('track_files', true);
    await queryRunner.dropTable('tracks', true);
    await queryRunner.dropTable('profiles', true);
    await queryRunner.dropTable('tags', true);
    await queryRunner.dropTable('genres', true);
    await queryRunner.dropTable('users', true);
    await queryRunner.query('DROP EXTENSION IF EXISTS "uuid-ossp"');
  }
}
