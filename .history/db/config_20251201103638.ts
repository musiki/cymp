import { defineDb, defineTable, column, NOW } from 'astro:db';

// Better-auth required tables
const User = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    email: column.text({ unique: true }),
    name: column.text(),
    emailVerified: column.boolean({ default: false }),
    image: column.text({ optional: true }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
    // Custom fields
    role: column.text({ default: 'student' }),
  }
});

const Session = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text({ references: () => User.columns.id }),
    expiresAt: column.date(),
    token: column.text({ unique: true }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
    ipAddress: column.text({ optional: true }),
    userAgent: column.text({ optional: true }),
  }
});

const Account = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text({ references: () => User.columns.id }),
    accountId: column.text(),
    providerId: column.text(),
    accessToken: column.text({ optional: true }),
    refreshToken: column.text({ optional: true }),
    idToken: column.text({ optional: true }),
    expiresAt: column.date({ optional: true }),
    password: column.text({ optional: true }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  }
});

const Verification = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    identifier: column.text(),
    value: column.text(),
    expiresAt: column.date(),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ optional: true }),
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
    courseId: column.text(), // Course ID from content collection (no FK constraint)
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
    attempts: column.number({ default: 1 }),
    submittedAt: column.date({ default: NOW }),
    gradedAt: column.date({ optional: true }),
    gradedBy: column.text({ optional: true, references: () => User.columns.id }),
  }
});

// https://astro.build/db/config
export default defineDb({
  tables: { 
    User, 
    Session, 
    Account, 
    Verification,
    Course, 
    Enrollment, 
    Assignment, 
    Submission 
  }
});
