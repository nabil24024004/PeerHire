import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [phase, setPhase] = useState<"intro" | "reveal" | "exit">("intro");

  useEffect(() => {
    const introTimer = setTimeout(() => setPhase("reveal"), 1200);
    const exitTimer = setTimeout(() => setPhase("exit"), 2400);
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 600);
    }, 2800);

    return () => {
      clearTimeout(introTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] bg-[#030305] flex items-center justify-center overflow-hidden"
        >
          {/* Radial gradient background */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            style={{
              background: "radial-gradient(ellipse 80% 50% at 50% 50%, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
            }}
          />

          {/* Animated grid lines */}
          <div className="absolute inset-0 overflow-hidden opacity-20">
            <motion.div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                  linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
                `,
                backgroundSize: "60px 60px",
              }}
              initial={{ opacity: 0, scale: 1.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>

          {/* Orbiting particles */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-primary"
                initial={{
                  opacity: 0,
                  x: 0,
                  y: 0,
                }}
                animate={{
                  opacity: phase === "exit" ? 0 : [0, 1, 1, 0],
                  x: [0, Math.cos((i * Math.PI * 2) / 8) * 120],
                  y: [0, Math.sin((i * Math.PI * 2) / 8) * 120],
                }}
                transition={{
                  duration: 1.2,
                  delay: i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            ))}
          </div>

          {/* Central morphing shape */}
          <motion.div
            className="absolute"
            initial={{ scale: 0, rotate: -90 }}
            animate={{
              scale: phase === "exit" ? 15 : 1,
              rotate: phase === "exit" ? 180 : 0,
              opacity: phase === "exit" ? 0 : 1,
            }}
            transition={{
              duration: phase === "exit" ? 0.8 : 0.8,
              ease: [0.22, 1, 0.36, 1]
            }}
          >
            {/* <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-primary/40 shadow-[0_0_60px_20px_hsl(var(--primary)/0.3)]" /> */}
          </motion.div>

          {/* Inner glow ring */}
          <motion.div
            className="absolute w-40 h-40 rounded-full border-2 border-primary/40"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: phase === "exit" ? 2 : [0, 1.2, 1],
              opacity: phase === "exit" ? 0 : [0, 0.8, 0.5],
            }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Logo letter */}
          <motion.div
            className="absolute z-10"
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{
              opacity: phase === "exit" ? 0 : 1,
              scale: phase === "exit" ? 1.5 : 1,
              y: 0,
            }}
            transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src="/logo.png"
              alt="PeerHire"
              className="w-32 h-32 rounded-3xl drop-shadow-2xl"
            />
          </motion.div>

          {/* Brand text */}
          <motion.div
            className="absolute flex flex-col items-center"
            style={{ top: "calc(50% + 100px)" }}
            initial={{ opacity: 0, y: 30 }}
            animate={{
              opacity: phase !== "intro" ? (phase === "exit" ? 0 : 1) : 0,
              y: phase !== "intro" ? 0 : 30,
            }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              <span className="text-foreground">Peer</span>
              <span className="text-primary">Hire</span>
            </h1>
            <motion.div
              className="mt-4 flex gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === "reveal" ? 1 : 0 }}
              transition={{ delay: 0.3 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary/80"
                  animate={{
                    y: [0, -6, 0],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* Corner accents */}
          <motion.div
            className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-primary/30 rounded-tl-lg"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: phase === "exit" ? 0 : 0.6, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          />
          <motion.div
            className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-primary/30 rounded-br-lg"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: phase === "exit" ? 0 : 0.6, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          />

          {/* Scan line effect */}
          <motion.div
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
            initial={{ top: "0%", opacity: 0 }}
            animate={{
              top: ["0%", "100%"],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2,
              ease: "linear",
              times: [0, 0.1, 0.9, 1],
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
