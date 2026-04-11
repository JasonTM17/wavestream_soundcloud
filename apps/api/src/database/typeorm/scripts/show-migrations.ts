import dataSource from 'src/database/typeorm/data-source';

async function main() {
  try {
    await dataSource.initialize();
    const hasPendingMigrations = await dataSource.showMigrations();

    console.log(
      hasPendingMigrations ? 'Pending migrations are available.' : 'No pending migrations.',
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
