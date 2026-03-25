import { PrismaClient, Role, ClubCategory, ClubStatus } from "@prisma/client"
import { createHash } from "crypto"

const prisma = new PrismaClient()

// Simple SHA-256 hash for seed data only.
// Replace with bcrypt/argon2 in production auth logic.
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex")
}

async function main() {
  console.log("Seeding database…")

  // ── Users ──────────────────────────────────────────────────────────────────

  const admin = await prisma.user.upsert({
    where: { email: "admin@educore.edu.my" },
    update: {},
    create: {
      fullName: "System Admin",
      email: "admin@educore.edu.my",
      studentId: "ADMIN001",
      password: hashPassword("admin1234"),
      faculty: "Administration",
      degree: "N/A",
      intakeYear: 2020,
      role: Role.ADMIN,
    },
  })

  const alice = await prisma.user.upsert({
    where: { email: "alice@student.edu.my" },
    update: {},
    create: {
      fullName: "Alice Tan Mei Ling",
      email: "alice@student.edu.my",
      studentId: "S20220001",
      password: hashPassword("password123"),
      faculty: "Faculty of Computer Science & Information Technology",
      degree: "Bachelor of Computer Science",
      intakeYear: 2022,
      role: Role.STUDENT,
      phone: "0123456789",
    },
  })

  const bob = await prisma.user.upsert({
    where: { email: "bob@student.edu.my" },
    update: {},
    create: {
      fullName: "Muhammad Hafiz bin Razali",
      email: "bob@student.edu.my",
      studentId: "S20220002",
      password: hashPassword("password123"),
      faculty: "Faculty of Engineering",
      degree: "Bachelor of Electrical Engineering",
      intakeYear: 2022,
      role: Role.STUDENT,
      phone: "0198765432",
    },
  })

  const carol = await prisma.user.upsert({
    where: { email: "carol@student.edu.my" },
    update: {},
    create: {
      fullName: "Priya Devi A/P Kumar",
      email: "carol@student.edu.my",
      studentId: "S20210003",
      password: hashPassword("password123"),
      faculty: "Faculty of Medicine",
      degree: "Bachelor of Medicine",
      intakeYear: 2021,
      role: Role.STUDENT,
    },
  })

  console.log(`  ✓ Users: ${admin.email}, ${alice.email}, ${bob.email}, ${carol.email}`)

  // ── Clubs ──────────────────────────────────────────────────────────────────

  const csClub = await prisma.club.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Computer Science Society",
      category: ClubCategory.ACADEMIC,
      description:
        "A club for CS students to collaborate on projects, hackathons, and tech talks.",
      requirements: "Open to all CS & IT students. GPA ≥ 2.5 preferred.",
      capacity: 50,
      status: ClubStatus.OPEN,
      email: "css@student.edu.my",
    },
  })

  const badmintonClub = await prisma.club.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "Badminton Club",
      category: ClubCategory.SPORTS,
      description:
        "Competitive and recreational badminton for all skill levels. We compete in inter-varsity tournaments.",
      requirements: "Open to all students. Bring your own racket.",
      capacity: 30,
      status: ClubStatus.OPEN,
      email: "badminton@student.edu.my",
    },
  })

  const culturalClub = await prisma.club.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: "Cultural Heritage Society",
      category: ClubCategory.CULTURAL,
      description:
        "Celebrating Malaysia's diverse cultural heritage through performances, exhibitions, and events.",
      requirements: "Open to all students regardless of background.",
      capacity: 40,
      status: ClubStatus.OPEN,
      email: "culture@student.edu.my",
    },
  })

  console.log(
    `  ✓ Clubs: ${csClub.name}, ${badmintonClub.name}, ${culturalClub.name}`
  )

  // ── Semesters + Subjects for Alice ────────────────────────────────────────

  const sem1 = await prisma.semester.upsert({
    where: { id: 1 },
    update: {},
    create: {
      semesterNum: 1,
      academicYear: "2022/2023",
      gpa: 3.67,
      userId: alice.id,
    },
  })

  await prisma.subjectResult.createMany({
    skipDuplicates: true,
    data: [
      {
        subjectCode: "CS1010",
        subjectName: "Programming Fundamentals",
        credits: 3,
        marks: 88,
        grade: "A",
        semesterId: sem1.id,
      },
      {
        subjectCode: "CS1020",
        subjectName: "Data Structures",
        credits: 3,
        marks: 75,
        grade: "B+",
        semesterId: sem1.id,
      },
      {
        subjectCode: "MTH1010",
        subjectName: "Calculus I",
        credits: 3,
        marks: 82,
        grade: "A-",
        semesterId: sem1.id,
      },
    ],
  })

  const sem2 = await prisma.semester.upsert({
    where: { id: 2 },
    update: {},
    create: {
      semesterNum: 2,
      academicYear: "2022/2023",
      gpa: 3.33,
      userId: alice.id,
    },
  })

  await prisma.subjectResult.createMany({
    skipDuplicates: true,
    data: [
      {
        subjectCode: "CS2010",
        subjectName: "Object-Oriented Programming",
        credits: 3,
        marks: 79,
        grade: "B+",
        semesterId: sem2.id,
      },
      {
        subjectCode: "CS2020",
        subjectName: "Database Systems",
        credits: 3,
        marks: 85,
        grade: "A",
        semesterId: sem2.id,
      },
      {
        subjectCode: "CS2030",
        subjectName: "Computer Networks",
        credits: 3,
        marks: 68,
        grade: "B",
        semesterId: sem2.id,
      },
    ],
  })

  console.log(`  ✓ Semesters & subjects seeded for ${alice.fullName}`)

  // ── Sport Achievement for Bob ──────────────────────────────────────────────

  await prisma.sportAchievement.createMany({
    skipDuplicates: true,
    data: [
      {
        sportName: "Badminton",
        achievementType: "TROPHY",
        position: "1st",
        date: new Date("2023-05-10"),
        points: 50,
        userId: bob.id,
      },
      {
        sportName: "Table Tennis",
        achievementType: "MEDAL",
        position: "3rd",
        date: new Date("2023-09-22"),
        points: 20,
        userId: bob.id,
      },
    ],
  })

  console.log(`  ✓ Sport achievements seeded for ${bob.fullName}`)

  console.log("\nSeed complete.")
  console.log("\nTest accounts:")
  console.log("  Admin  → admin@educore.edu.my   / admin1234")
  console.log("  Student → alice@student.edu.my  / password123")
  console.log("  Student → bob@student.edu.my    / password123")
  console.log("  Student → carol@student.edu.my  / password123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
