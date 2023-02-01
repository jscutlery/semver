import { release } from './release';

release().catch((error) => {
  console.error(error);
  process.exit(1);
});
