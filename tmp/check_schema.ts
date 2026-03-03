
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function checkSchema() {
    console.log('--- READING SCHEMA ---');
    const { data: readData, error: readError } = await supabase.from('Reading').select('*').limit(1);
    if (readError) console.error('Reading Error:', readError);
    else console.log('Reading Columns:', Object.keys(readData?.[0] || {}));

    console.log('\n--- ALERT SCHEMA ---');
    const { data: alertData, error: alertError } = await supabase.from('Alert').select('*').limit(1);
    if (alertError) console.error('Alert Error:', alertError);
    else console.log('Alert Columns:', Object.keys(alertData?.[0] || {}));
}

checkSchema();
