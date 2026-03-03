
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function count() {
    const { count: readCount } = await supabase.from('Reading').select('*', { count: 'exact', head: true });
    const { count: alertCount } = await supabase.from('Alert').select('*', { count: 'exact', head: true });
    console.log('Readings Count:', readCount);
    console.log('Alerts Count:', alertCount);
}

count();
