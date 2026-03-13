const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const userCount = await prisma.user.count()
  const accountCount = await prisma.account.count()
  console.log('--- DATABASE STATUS ---')
  console.log(`Users: ${userCount}`)
  console.log(`Accounts: ${accountCount}`)
  
  if (userCount > 0) {
    const users = await prisma.user.findMany()
    console.log('Last 5 users:', JSON.stringify(users.slice(-5), null, 2))
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
