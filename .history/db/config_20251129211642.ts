import { defineDb, defineTable, column} from 'astro:db';

// https://astro.build/db/config
export default defineDb({
  tables: { User, Course, Enrollment, Assignment, Submission}
});
