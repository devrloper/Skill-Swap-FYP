import Button from "@/app/ui/button";

export default function MatchCard({
  name,
  offer,
  seek,
  location,
  tags,
  education,
  imageUrl,
}) {
  const displayImage = imageUrl || "/girl.png";

  return (
    <div
      className="
        bg-white rounded-xl shadow-sm p-4
        h-auto lg:max-h-[220px]
        flex flex-col
      "
    >
      {/* Top Section */}
      <div className="flex gap-4">
        <img
          src={displayImage}
          width={64}
          height={64}
          alt="profile"
          className="
    h-16 w-16 rounded-full object-cover flex-shrink-0
    ring-2 ring-purple-950 ring-offset-2 ring-offset-white
  "
        />

        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">{name}</h3>

          <p className="text-sm text-gray-500">Offering: {offer}</p>

          <p className="text-sm text-gray-500">Seeking: {seek}</p>

          {education && (
            <p className="text-sm text-gray-500">Education: {education}</p>
          )}
        </div>
      </div>

      {/* Tags (height controlled) */}
      <div className="flex flex-wrap gap-2 mt-3 max-h-[90px] overflow-y-auto">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Bottom */}
      <div className="flex justify-between items-center mt-auto pt-4">
        <span className="text-xs text-gray-400">{location}</span>

        <Button>Connect</Button>
      </div>
    </div>
  );
}
