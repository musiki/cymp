import { db, User, eq } from 'astro:db';

// https://astro.build/db/seed
export default async function seed() {
	console.log('[DB] Starting seed...');
	
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
	
	console.log('[DB] Seed completed');
}
