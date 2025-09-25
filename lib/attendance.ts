import { supabase } from '@/lib/supabaseClient';


// Save attendance to Supabase
export async function saveAttendance(sessionId: string, studentId: string, status: string) {
  const { data, error } = await supabase
    .from('attendance')
    .insert([{ session_id: sessionId, student_id: studentId, status }]);

  if (error) console.error('Error saving attendance:', error.message);
  return data;
}

// Get attendance for a class
export async function getAttendance(classId: string) {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('class_id', classId);
    
  if (error) console.error('Error fetching attendance:', error.message);
  return data;
}
