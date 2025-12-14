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
	
	// Note: Assignments are now auto-created by the submit API when students answer eval blocks
	// No need to manually add them here!
	
	console.log('[DB] ℹ️  Assignments will be auto-created when students submit answers');
	console.log('[DB] Seed completed');
}
