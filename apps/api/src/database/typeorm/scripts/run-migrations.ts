import dataSource from 'src/database/typeorm/data-source';

async function main() {
  try {
    await dataSource.initialize();
    const executed = await dataSource.runMigrations();

    if (executed.length === 0) {
      console.log('No pending migrations.');
      return;
    }

    console.log(
      `Applied ${executed.length} migration(s): ${executed.map((migration) => migration.name).join(', ')}`,
    );
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
