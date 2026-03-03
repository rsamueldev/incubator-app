
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function check() {
    const deviceId = '777cec09-f5ca-4af4-8082-d8047aed6041';

    console.log('--- CHECKING DEVICE ---');
    const { data: device, error: devError } = await supabase
        .from('Device')
        .select('*')
        .eq('device_id', deviceId)
        .maybeSingle();

    if (devError) console.error('Device Error:', devError);
    else console.log('Device found:', device);

    console.log('\n--- CHECKING READINGS ---');
    const { data: readings, error: readError } = await supabase
        .from('Reading')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false })
        .limit(5);

    if (readError) console.error('Reading Error:', readError);
    else console.log('Recent Readings:', readings);

    console.log('\n--- CHECKING ALERTS ---');
    const { data: alerts, error: alertError } = await supabase
        .from('Alert')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false })
        .limit(5);

    if (alertError) console.error('Alert Error:', alertError);
    else console.log('Recent Alerts:', alerts);
}

check();
