import { motion, useMotionValue, useTransform, animate } from "framer-motion";

function MovieCard({ film, onSwipe, isTop }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const labelOpacityLeft = useTransform(x, [-100, -30, 0], [1, 0, 0]);
  const labelOpacityRight = useTransform(x, [0, 30, 100], [0, 0, 1]);
  const labelOpacityUp = useTransform(y, [-100, -30, 0], [1, 0, 0]);

  function handleDragEnd(_, info) {
    if (info.offset.x > 120) flyOut("right");
    else if (info.offset.x < -120) flyOut("left");
    else if (info.offset.y < -120) flyOut("up");
  }

  function flyOut(direction) {
    const targets = {
      right: { x: 600, y: 0 },
      left:  { x: -600, y: 0 },
      up:    { x: 0, y: -600 },
    };
    animate(x, targets[direction].x, { duration: 0.3 });
    animate(y, targets[direction].y, { duration: 0.3 });
    setTimeout(() => onSwipe(direction), 300);
  }

  if (!isTop) {
    return (
      <motion.div
        style={{
          position: "absolute",
          width: "300px",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
          scale: 0.95,
          top: 10,
          zIndex: 0,
        }}
      >
        <img
          src={`https://image.tmdb.org/t/p/w500${film.poster_path}`}
          alt={film.title}
          style={{ width: "100%", display: "block" }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      style={{
        x, y, rotate, opacity,
        position: "absolute",
        width: "300px",
        borderRadius: "16px",
        overflow: "hidden",
        cursor: "grab",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        zIndex: 1,
      }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: "grabbing" }}
    >
      <img
        src={`https://image.tmdb.org/t/p/w500${film.poster_path}`}
        alt={film.title}
        style={{ width: "100%", display: "block", pointerEvents: "none" }}
      />

      <motion.div style={{
        opacity: labelOpacityLeft,
        position: "absolute", top: 20, right: 20,
        background: "#ef4444", color: "white",
        padding: "6px 16px", borderRadius: "8px",
        fontWeight: "bold", fontSize: "18px", border: "2px solid white"
      }}>SKIP</motion.div>

      <motion.div style={{
        opacity: labelOpacityRight,
        position: "absolute", top: 20, left: 20,
        background: "#22c55e", color: "white",
        padding: "6px 16px", borderRadius: "8px",
        fontWeight: "bold", fontSize: "18px", border: "2px solid white"
      }}>À VOIR</motion.div>

      <motion.div style={{
        opacity: labelOpacityUp,
        position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)",
        background: "#3b82f6", color: "white",
        padding: "6px 16px", borderRadius: "8px",
        fontWeight: "bold", fontSize: "18px", border: "2px solid white"
      }}>DÉJÀ VU</motion.div>

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
        color: "white", padding: "40px 16px 16px",
        fontSize: "18px", fontWeight: "bold"
      }}>
        {film.title}
      </div>
    </motion.div>
  );
}

export default MovieCard;