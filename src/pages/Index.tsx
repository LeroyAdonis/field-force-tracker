import { Navigate } from "react-router-dom";
import { useApp } from "@/lib/store";

const Index = () => {
  const user = useApp(s => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "admin" ? "/admin" : "/worker"} replace />;
};

export default Index;
