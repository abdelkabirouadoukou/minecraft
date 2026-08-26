import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="text-center p-12">
      <h1 className="text-4xl font-bold mb-4">Welcome to Minecraft</h1>
      <Image src="/logo.png" alt="Minecraft Logo" width={200} height={200} />
      <p className="mt-4 mb-8">Explore the world of Minecraft and build your own adventures.</p>
      <Link href={'/game'} className="inline-block px-5 py-2 bg-green-500 text-white no-underline rounded-md">
          Play Game
      </Link>
      <br /><br />
      <Link href={'/bedwars'} className="inline-block px-5 py-2 bg-blue-500 text-white no-underline rounded-md">
          Multiplayer
      </Link>
      <br /><br />
      <Link href={'https://github.com/abdelkabirouadoukou/minecraft'} className="inline-block px-5 py-2 bg-gray-800 text-white no-underline rounded-md">
          View Repository
      </Link>
    </div>
  );
}