import { db, User, Course, Assignment, eq, Enrollment } from 'astro:db';

// https://astro.build/db/seed
export default async function seed() {
	console.log('[DB] Starting seed...');
	console.log('[DB] ⚠️  Note: Seed preserves existing user data but ensures required records');
	
	// Check if teacher user exists
	const teacherEmail = 'lucianoazzigotti@gmail.com';
	const existingUser = await db.select().from(User).where(eq(User.email, teacherEmail));
	
	if (existingUser.length === 0) {
		// Create teacher user
		await db.insert(User).values({
			id: crypto.randomUUID(),
			email: teacherEmail,
			name: 'Luciano Azzigotti',
			emailVerified: true,
			role: 'teacher',
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		console.log('[DB] ✅ Teacher user created:', teacherEmail);
	} else {
		// Ensure user has teacher role
		if (existingUser[0].role !== 'teacher') {
			await db.update(User)
				.set({ role: 'teacher', updatedAt: new Date() })
				.where(eq(User.email, teacherEmail));
			console.log('[DB] ✅ User promoted to teacher:', teacherEmail);
		} else {
			console.log('[DB] ℹ️  Teacher user already exists:', teacherEmail);
		}
	}
	
	// Create course if doesn't exist
	const courseId = 'ejemplo-generative-art';
	const existingCourse = await db.select().from(Course).where(eq(Course.id, courseId));
	
	if (existingCourse.length === 0) {
		await db.insert(Course).values({
			id: courseId,
			title: 'Arte Generativo con p5.js',
		});
		console.log('[DB] ✅ Course created:', courseId);
	} else {
		console.log('[DB] ℹ️  Course already exists:', courseId);
	}
	
	// Create assignments for eval blocks
	const assignments = [
		{
			id: 'gen-art-u1-q1',
			courseId: courseId,
			slug: 'ejemplo-generative-art/01-conceptos-basicos/03-autoevaluacion',
			type: 'multiple-choice',
			weight: 1,
		},
		{
			id: 'gen-art-u1-q2',
			courseId: courseId,
			slug: 'ejemplo-generative-art/01-conceptos-basicos/03-autoevaluacion',
			type: 'multiple-choice',
			weight: 1,
		},
		{
			id: 'gen-art-u1-q3',
			courseId: courseId,
			slug: 'ejemplo-generative-art/01-conceptos-basicos/03-autoevaluacion',
			type: 'multiple-choice',
			weight: 1,
		},
		{
			id: 'gen-art-u1-q4',
			courseId: courseId,
			slug: 'ejemplo-generative-art/01-conceptos-basicos/03-autoevaluacion',
			type: 'multiple-choice',
			weight: 1,
		},
	];
	
	for (const assignment of assignments) {
		const existing = await db.select().from(Assignment).where(eq(Assignment.id, assignment.id));
		if (existing.length === 0) {
			await db.insert(Assignment).values(assignment);
			console.log('[DB] ✅ Assignment created:', assignment.id);
		} else {
			console.log('[DB] ℹ️  Assignment already exists:', assignment.id);
		}
	}
	
	console.log('[DB] Seed completed');
}
