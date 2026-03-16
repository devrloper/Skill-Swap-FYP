import Button from "@/app/ui/button";

export default function MatchCard({
  id,
  name,
  offer,
  seek,
  location,
  tags,
  education,
  imageUrl,
  showConnect = true,
  connectDisabled = false,
  connectLabel = "Connect",
  onConnect,
}) {
  const displayImage = imageUrl || "/girl.png";

  return (
    <div
      className="
        bg-white/30 backdrop-blur-lg border border-white/30
        rounded-3xl shadow-lg p-4
        h-auto lg:max-h-[220px]
        flex flex-col
        hover:shadow-2xl hover:scale-[1.02]
        transition-all duration-300 cursor-pointer
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
            ring-2 ring-black/40 ring-offset-2 ring-offset-transparent
          "
        />

        <div className="flex-1 ">
          {/* Name */}
          <h3 className="font-semibold text-black text-lg">
            {name}
          </h3>

          {/* Offer */}
          <p className="text-sm text-black">
            <span className="font-semibold">Offering:</span> {offer}
          </p>

          {/* Seek */}
          <p className="text-sm text-black">
            <span className="font-semibold">Seeking:</span> {seek}
          </p>

          {/* Education */}
          {education && (
            <p className="text-sm text-black">
              <span className="font-semibold">Education:</span> {education}
            </p>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mt-3 max-h-[90px] overflow-y-auto">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="
              text-xs
              bg-black/10
              text-black
              px-2 py-1 rounded-md
              hover:bg-black/20
              transition
            "
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Bottom */}
      <div className="flex justify-between items-center mt-auto pt-4">
        <span className="text-xs text-black/70">
          {location}
        </span>

        {showConnect && (
          <Button
            type="button"
            onClick={onConnect}
            disabled={connectDisabled}
            aria-disabled={connectDisabled}
            className="bg-black text-white hover:scale-105 transition disabled:opacity-60 disabled:cursor-not-allowed"
            data-profile-id={id}
          >
            {connectLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
