import Image from "next/image";
import Button from "@/app/ui/button"
export default function MatchCard({ name, offer, seek, location, tags }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex gap-4">
        <Image
          src=""
          width={64}
          height={64}
          alt="profile"
          className="rounded-full"
        />

        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">{name}</h3>
          <p className="text-sm text-gray-500">
            Offering: {offer}
          </p>
          <p className="text-sm text-gray-500">
            Seeking: {seek}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex justify-between items-center mt-4">
        <span className="text-xs text-gray-400">
          {location}
        </span>

        <Button >
          View Profile
        </Button>
      </div>
    </div>
  );
}
