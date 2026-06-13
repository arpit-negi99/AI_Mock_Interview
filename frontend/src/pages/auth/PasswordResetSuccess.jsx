import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ROUTES } from "@/constants/routes";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function PasswordResetSuccess() {
  return (
    <Card className="w-full max-w-md" animate={false}>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.h1
          variants={item}
          className="text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Password reset complete
        </motion.h1>
        <motion.p
          variants={item}
          className="text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          Your password has been reset successfully. You can now sign in with
          your new password.
        </motion.p>
        <motion.div variants={item} className="pt-2">
          <Link to={ROUTES.LOGIN}>
            <Button className="w-full">Go to sign in</Button>
          </Link>
        </motion.div>
      </motion.div>
    </Card>
  );
}
