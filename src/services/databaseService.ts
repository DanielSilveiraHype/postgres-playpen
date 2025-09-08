// Mock data and services for database client
export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey?: boolean;
}

export interface Table {
  name: string;
  columns: Column[];
}

export interface SqlResult {
  sqlTime: string;
  result: string;
  data: Record<string, unknown>[];
}



export const API = {

  post(data: unknown) {

    const token = localStorage.getItem("accessToken");



    return fetch('https://broker-api-dev.neobpo.com.br/db-helper/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(data)
    })
      .then(response => response.json())
      .then(json => {
        
        return json
      });
  }

}

export const databaseService = {
  // Simulate API delay
  delay: (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms)),

  async runQuery(query: string) {

    return API.post({ sql: query });
  },

  async getTables(): Promise<Table[]> {

    const result = await this.runQuery(`
  SELECT
    t.table_name,
    c.column_name,
    CASE 
      WHEN c.character_maximum_length IS NOT NULL 
        THEN c.data_type || '(' || c.character_maximum_length || ')' 
        ELSE c.data_type 
    END AS column_type,
    c.is_nullable,
    CASE WHEN k.column_name IS NOT NULL THEN 'YES' ELSE 'NO' END AS primary_key
  FROM information_schema.tables t
  JOIN information_schema.columns c 
    ON t.table_name = c.table_name
  LEFT JOIN (
    SELECT
        tc.table_name,
        kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
  ) k
    ON t.table_name = k.table_name AND c.column_name = k.column_name
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name, c.ordinal_position;
`);


    const tablesMap: Record<string, Table> = {};


    result.rows.forEach((row: { table_name: string, column_name: string, column_type: string, primary_key: string, is_nullable: string }) => {
      const tableName = row.table_name;

      if (!tablesMap[tableName]) {
        tablesMap[tableName] = { name: tableName, columns: [] };
      }

      tablesMap[tableName].columns.push({
        name: row.column_name,
        type: row.column_type,
        nullable: row.is_nullable === 'YES', // se você tiver essa coluna no SELECT
        primaryKey: row.primary_key === 'YES'
      });
    });

    // converte pra array
    const tables: Table[] = Object.values(tablesMap);
    return tables;
  },

  async runSql(sql: string): Promise<SqlResult> {
    await this.delay();

    const result = await this.runQuery(sql);

    if(result.error){
      return {
        sqlTime: new Date().toISOString(),
        result: "Error: " + result.error,
        data: [] 
      };
    }

     return {
        sqlTime: new Date().toISOString(),
        result: "Query executed successfully",
        data: result.rows 
      };

  }
};