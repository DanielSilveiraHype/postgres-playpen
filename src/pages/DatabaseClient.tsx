import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Search, Play, Plus, Eye, ArrowUpDown } from "lucide-react";
import { databaseService, Table as DBTable, SqlResult } from "@/services/databaseService";
import { useToast } from "@/hooks/use-toast";

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

const DatabaseClient = () => {
  const [tables, setTables] = useState<DBTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<DBTable | null>(null);
  const [sqlQuery, setSqlQuery] = useState("");
  const [sqlResult, setSqlResult] = useState<SqlResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  
  const { toast } = useToast();
  const form = useForm();

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setIsLoading(true);
      const data = await databaseService.getTables();
      setTables(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar tabelas",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeSql = async () => {
    if (!sqlQuery.trim()) return;
    
    try {
      setIsLoading(true);
      const result = await databaseService.runSql(sqlQuery);
      setSqlResult(result);
      toast({
        title: "Sucesso",
        description: `Query executada em ${result.sqlTime}`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao executar query",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!sqlResult?.data || !searchFilter) return sqlResult?.data || [];
    
    return sqlResult.data.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(searchFilter.toLowerCase())
      )
    );
  }, [sqlResult?.data, searchFilter]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current?.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const openRecordDialog = (record: Record<string, unknown> | null = null) => {
    setSelectedRecord(record);
    setIsNewRecord(!record);
    setShowRecordDialog(true);
    
    if (record) {
      form.reset(record);
    } else if (selectedTable) {
      const emptyRecord: Record<string, unknown> = {};
      selectedTable.columns.forEach(col => {
        emptyRecord[col.name] = '';
      });
      form.reset(emptyRecord);
    }
  };

  const handleSubmitRecord = (data: unknown) => {
    // In a real app, this would make an API call
    toast({
      title: "Sucesso",
      description: isNewRecord ? "Registro criado" : "Registro atualizado"
    });
    setShowRecordDialog(false);
  };

  return (
    <div className="w-full h-screen mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Cliente PostgreSQL</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tables Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle>Tabelas {tables.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {tables.map((table) => (
                <Button
                  key={table.name}
                  variant={selectedTable?.name === table.name ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedTable(table)}
                >
                  {table.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Table Columns */}
        <Card>
          <CardHeader>
            <CardTitle>
              Colunas {selectedTable && `- ${selectedTable.name}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTable ? (
              <div className="space-y-2  max-h-[300px] overflow-y-auto">
                {selectedTable.columns.map((column) => (
                  <div key={column.name} className="flex items-center gap-2 p-2 border rounded">
                    <span className="font-medium">{column.name}</span>
                    <Badge variant="secondary">{column.type}</Badge>
                    {column.primaryKey && <Badge variant="default">PK</Badge>}
                    {!column.nullable && <Badge variant="outline">NOT NULL</Badge>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Selecione uma tabela</p>
            )}
          </CardContent>
        </Card>

        {/* SQL Query */}
        <Card>
          <CardHeader>
            <CardTitle>Query SQL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Digite sua query SQL aqui..."
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              rows={6}
            />
            <Button onClick={executeSql} disabled={isLoading} className="w-full">
              <Play className="w-4 h-4 mr-2" />
              Executar Query
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {sqlResult && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Resultados</CardTitle>
              <p className="text-sm text-muted-foreground">
                {sqlResult.result} | Executado em: {new Date(sqlResult.sqlTime).toLocaleString()}
              </p>
            </div>
            {sqlResult.data.length > 0 && (
              <Button onClick={() => openRecordDialog()} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Novo Registro
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {sqlResult.data.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <Input
                    placeholder="Filtrar resultados..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(sqlResult.data[0]).map((column) => (
                          <TableHead key={column}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSort(column)}
                              className="h-8 p-0 font-medium"
                            >
                              {column}
                              <ArrowUpDown className="w-3 h-3 ml-1" />
                            </Button>
                          </TableHead>
                        ))}
                        <TableHead className="w-20">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedData.map((row, index) => (
                        <TableRow key={index}>
                          {Object.values(row).map((value, cellIndex) => (
                            <TableCell key={cellIndex}>
                              {typeof value === 'boolean' ? (
                                <Badge variant={value ? "default" : "secondary"}>
                                  {value ? "Sim" : "Não"}
                                </Badge>
                              ) : (
                                String(value)
                              )}
                            </TableCell>
                          ))}
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openRecordDialog(row)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                {sqlResult.result}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Record Dialog */}
      <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNewRecord ? "Novo Registro" : "Visualizar/Editar Registro"}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTable && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmitRecord)} className="space-y-4">
                {selectedTable.columns.map((column) => (
                  <FormField
                    key={column.name}
                    control={form.control}
                    name={column.name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          {column.name}
                          <Badge variant="secondary" className="text-xs">
                            {column.type}
                          </Badge>
                          {column.primaryKey && <Badge className="text-xs">PK</Badge>}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={column.primaryKey && !isNewRecord}
                            placeholder={`Digite ${column.name}...`}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
                
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {isNewRecord ? "Criar" : "Salvar"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRecordDialog(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DatabaseClient;