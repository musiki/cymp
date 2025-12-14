import { defineDb, defineTable, column } from 'astro:db';

const User = defineTable({
  columns: {
    id: column.text({ primaryKey: true }), // ID provisto por better-auth o el proveedor de auth
    email: column.text({ unique: true }),
    name: column.text(),
    // Rol base: 'admin', 'teacher', 'student'
    role: column.text({ default: 'student' }),
  }
});

const Course = defineTable({
  columns: {
    id: column.text({ primaryKey: true }), // ej: 'astro-101'
    title: column.text(),
  }
});

const Enrollment = defineTable({
  columns: {
    userId: column.text({ references: () => User.columns.id }),
    courseId: column.text({ references: () => Course.columns.id }),
    // Rol específico del curso: 'teacher', 'student'
    roleInCourse: column.text({ default: 'student' }),
  }
});

const Assignment = defineTable({
  columns: {
    id: column.text({ primaryKey: true }), // ej: 'astro-101/tp-01'
    courseId: column.text({ references: () => Course.columns.id }),
    slug: column.text({ unique: true }), // El 'slug' de tu archivo .mdx
    type: column.text(), // 'multiple-choice', 'text-inference'
    weight: column.number({ default: 1 }), // Ponderación en el curso
  }
});

const Submission = defineTable({
  columns: {
    id: column.text({ primaryKey: true }), // autogenerado
    userId: column.text({ references: () => User.columns.id }),
    assignmentId: column.text({ references: () => Assignment.columns.id }),
    payload: column.json(), // Para multiple choice: { "q1": "A", "q2": "C" }
    score: column.number({ optional: true }),
    feedback: column.text({ optional: true }),
    rubricJson: column.json({ optional: true }), // Evaluación detallada de la IA
  }
});

// https://astro.build/db/config
export default defineDb({
  tables: { User, Course, Enrollment, Assignment, Submission}
});
