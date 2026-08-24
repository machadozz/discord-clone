import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaBetterSqlite3({
  url: 'file:./dev.db',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = 'alex_cyber' + Math.floor(Math.random() * 1000);
  const email = `alex.${Date.now()}@pulse.app`;
  const password = 'User123456!';
  const passwordHash = await bcrypt.hash(password, 12);
  const discriminator = Math.floor(1000 + Math.random() * 9000).toString();

  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      discriminator,
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000&auto=format&fit=crop&q=80',
      status: 'ONLINE',
    },
  });

  console.log('========================================');
  console.log('🎉 NOVO USUÁRIO CRIADO COM SUCESSO!');
  console.log(`- Email: ${user.email}`);
  console.log(`- Senha: ${password}`);
  console.log(`- Username: ${user.username}`);
  console.log(`- Tag: #${user.discriminator}`);
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
