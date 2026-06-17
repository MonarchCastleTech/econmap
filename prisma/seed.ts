import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.watchlist.upsert({
    where: { id: "showcase-watchlist" },
    update: {},
    create: {
      id: "showcase-watchlist",
      name: "Showcase Markets",
      description: "Seeded analyst watchlist for the demo environment.",
      items: ["united-states", "germany", "india", "brazil", "turkiye"],
    },
  });

  await prisma.dashboard.upsert({
    where: { id: "macro-dashboard" },
    update: {},
    create: {
      id: "macro-dashboard",
      name: "Macro Pulse",
      description: "Seeded dashboard focused on growth, inflation, labor, and trade.",
      layout: [
        { id: "gdp-growth", x: 0, y: 0, w: 6, h: 4 },
        { id: "inflation", x: 6, y: 0, w: 6, h: 4 },
        { id: "trade-balance", x: 0, y: 4, w: 12, h: 5 },
      ],
      filters: {
        countries: ["united-states", "germany", "india"],
        year: 2025,
      },
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
