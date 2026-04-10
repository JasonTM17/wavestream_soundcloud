import dataSource from 'src/database/typeorm/data-source';

async function main() {
  try {
    await dataSource.initialize();
    await dataSource.undoLastMigration();
    console.log('Reverted the latest migration.');
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
