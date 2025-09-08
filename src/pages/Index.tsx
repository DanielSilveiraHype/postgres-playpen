import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string>("");
  const [tempToken, setTokenText] = useState<string>("");

  const saveToken = () => {

    localStorage.setItem("accessToken", tempToken);
    setToken(tempToken);

  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="vertical-center">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold mb-4">Setar Token</h1>
          <p className="text-xl text-muted-foreground">
            Informe o Token de Acesso
          </p>
          <Input
            placeholder="Token de Acesso"
            onChange={(e) => setTokenText(e.target.value)}
          />
          <Button onClick={(e) => saveToken()} size="lg">
            Setar Token
          </Button>
        </div>

        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold mb-4">Cliente PostgreSQL</h1>
          <p className="text-xl text-muted-foreground">
            Acesse o cliente de banco de dados
          </p>
          <Button onClick={() => navigate("/database")} size="lg" disabled={!token}>
            Abrir Cliente
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
