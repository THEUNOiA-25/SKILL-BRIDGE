import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface College {
  name: string;
  state: string;
  city: string;
  country: string;
  is_active: boolean;
}

export default function AdminCollegesPage() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<{ total: number; inserted: number; errors: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): College[] => {
    const lines = text.split('\n');
    const colleges: College[] = [];
    
    // Skip header rows (first two lines based on the CSV structure)
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Handle CSV with quoted fields
      const matches = line.match(/("([^"]*)"|[^,]+)/g);
      if (!matches || matches.length < 5) continue;
      
      const cleanField = (field: string) => field.replace(/^"|"$/g, '').trim();
      
      const name = cleanField(matches[0]);
      const state = cleanField(matches[1]);
      const city = cleanField(matches[2]);
      const country = cleanField(matches[3]) || 'India';
      const isActiveStr = cleanField(matches[4]);
      
      if (name && name !== 'Name') {
        colleges.push({
          name,
          state,
          city,
          country,
          is_active: isActiveStr.toUpperCase() === 'TRUE'
        });
      }
    }
    
    return colleges;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setStats(null);

    try {
      const text = await file.text();
      const colleges = parseCSV(text);
      
      if (colleges.length === 0) {
        toast.error('No valid colleges found in CSV');
        setUploading(false);
        return;
      }

      toast.info(`Found ${colleges.length} colleges. Starting import...`);

      const batchSize = 500;
      let insertedCount = 0;
      let errorCount = 0;
      const totalBatches = Math.ceil(colleges.length / batchSize);

      for (let i = 0; i < colleges.length; i += batchSize) {
        const batch = colleges.slice(i, i + batchSize);
        const currentBatch = Math.floor(i / batchSize) + 1;
        
        const { error } = await supabase
          .from('colleges')
          .insert(batch);

        if (error) {
          console.error(`Batch ${currentBatch} error:`, error);
          errorCount += batch.length;
        } else {
          insertedCount += batch.length;
        }

        const progressPercent = Math.round((currentBatch / totalBatches) * 100);
        setProgress(progressPercent);
      }

      setStats({ total: colleges.length, inserted: insertedCount, errors: errorCount });
      
      if (errorCount === 0) {
        toast.success(`Successfully imported ${insertedCount} colleges!`);
      } else {
        toast.warning(`Imported ${insertedCount} colleges with ${errorCount} errors`);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import colleges');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">College Management</h1>
        <p className="text-muted-foreground mt-2">
          Import and manage the list of approved colleges
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Import Colleges from CSV</CardTitle>
          <CardDescription>
            Upload a CSV file with columns: Name, State, CITY, Country, is_active
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload CSV
                </>
              )}
            </Button>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing colleges...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {stats && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                {stats.errors === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <span className="font-medium">Import Complete</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total:</span>{' '}
                  <span className="font-medium">{stats.total.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Inserted:</span>{' '}
                  <span className="font-medium text-green-600">{stats.inserted.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Errors:</span>{' '}
                  <span className="font-medium text-red-600">{stats.errors.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
