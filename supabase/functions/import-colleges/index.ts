import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting college import...');

    // Step 1: Clear student_verifications college references first
    const { error: clearRefsError } = await supabase
      .from('student_verifications')
      .update({ college_id: null })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (clearRefsError) {
      console.error('Error clearing college references:', clearRefsError);
      throw clearRefsError;
    }
    console.log('Cleared college references from student_verifications');

    // Step 2: Clear community task references
    const { error: clearProjectsError } = await supabase
      .from('user_projects')
      .update({ community_college_id: null })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (clearProjectsError) {
      console.error('Error clearing project college references:', clearProjectsError);
      throw clearProjectsError;
    }
    console.log('Cleared college references from user_projects');

    // Step 3: Clear existing colleges
    const { error: deleteError } = await supabase
      .from('colleges')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error('Error deleting existing colleges:', deleteError);
      throw deleteError;
    }
    console.log('Cleared existing colleges');

    // Step 2: Fetch and parse the CSV
    const csvUrl = `${supabaseUrl}/storage/v1/object/public/project-files/colleges.csv`;
    
    // Since we can't access public folder directly, we'll parse from the request body
    const { csvData } = await req.json();
    
    if (!csvData) {
      throw new Error('CSV data is required in request body');
    }

    // Parse CSV
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));
    
    console.log('CSV Headers:', headers);
    console.log('Total lines:', lines.length);

    const colleges: { name: string; state: string; city: string; country: string }[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Handle CSV parsing with potential commas in quoted fields
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/"/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/"/g, ''));
      
      const nameIndex = headers.findIndex((h: string) => h.toLowerCase() === 'name');
      const stateIndex = headers.findIndex((h: string) => h.toLowerCase() === 'state');
      
      if (nameIndex !== -1 && values[nameIndex]) {
        colleges.push({
          name: values[nameIndex],
          state: stateIndex !== -1 ? values[stateIndex] || '' : '',
          city: '', // Not provided in CSV
          country: 'India'
        });
      }
    }

    console.log('Parsed colleges count:', colleges.length);

    // Step 3: Batch insert (500 at a time to avoid timeouts)
    const batchSize = 500;
    let inserted = 0;
    
    for (let i = 0; i < colleges.length; i += batchSize) {
      const batch = colleges.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('colleges')
        .insert(batch);
      
      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
        throw insertError;
      }
      
      inserted += batch.length;
      console.log(`Inserted ${inserted} / ${colleges.length} colleges`);
    }

    console.log('Import completed successfully!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully imported ${colleges.length} colleges`,
        count: colleges.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
