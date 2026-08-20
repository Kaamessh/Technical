import { supabase } from '../services/supabaseClient';

export const round4QuestionsData = [
  {
    question_text: '🏦 Bank Account — Status Mismatch: Find the ONE anomalous row.',
    options: {
      headers: ['Account ID', 'Customer', 'Account Type', 'Status', 'Opened', 'Closed', 'Last Txn', 'Branch'],
      rows: [
        ['AC101', 'Rahul Kumar', 'Savings', 'Active', '2021', '—', '2026-08-12', 'Chennai'],
        ['AC102', 'Priya Nair', 'Current', 'Active', '2020', '—', '2026-08-14', 'Mumbai'],
        ['AC103', 'Arjun Shah', 'Savings', 'Closed', '2019', '2025', '2025-02-10', 'Delhi'],
        ['AC104', 'Meena Rao', 'Savings', 'Active', '2022', '—', '2026-08-09', 'Pune'],
        ['AC105', 'Kiran Das', 'Current', 'Active', '2023', '—', '2026-08-16', 'Bengaluru'],
        ['AC106', 'Divya Menon', 'Savings', 'Closed', '2020', '2024', '2024-11-21', 'Kochi'],
        ['AC107', 'Sanjay Roy', 'Current', 'Active', '2021', '—', '2026-08-11', 'Hyderabad'],
        ['AC108', 'Neha Gupta', 'Savings', 'Active', '2024', '—', '2026-08-15', 'Chennai'],
        ['AC109', 'Ajay Verma', 'Current', 'Closed', '2018', '2023', '2026-08-01', 'Delhi'],
        ['AC110', 'Kavya Shah', 'Savings', 'Active', '2022', '—', '2026-08-17', 'Mumbai'],
      ],
    },
    correct_index: 8, // Row 9 (Ajay Verma: Closed account with 2026 txn after 2023 closure)
  },
  {
    question_text: '📚 Library — Borrow/Return Mismatch: Find the ONE anomalous row.',
    options: {
      headers: ['Borrow ID', 'Student', 'Book', 'Category', 'Issue Date', 'Return Date', 'Days Allowed', 'Status'],
      rows: [
        ['LB101', 'Rahul', 'Python Basics', 'Programming', '2026-08-01', '2026-08-08', '14', 'Returned'],
        ['LB102', 'Priya', 'DBMS', 'Programming', '2026-08-02', '2026-08-09', '14', 'Returned'],
        ['LB103', 'Arjun', 'Operating Systems', 'Programming', '2026-08-03', '2026-08-12', '14', 'Returned'],
        ['LB104', 'Meena', 'Data Structures', 'Programming', '2026-08-04', '2026-08-15', '14', 'Returned'],
        ['LB105', 'Kiran', 'Computer Networks', 'Programming', '2026-08-05', '2026-08-14', '14', 'Returned'],
        ['LB106', 'Divya', 'Artificial Intelligence', 'Programming', '2026-08-06', '2026-08-20', '14', 'Returned'],
        ['LB107', 'Sanjay', 'Database Systems', 'Programming', '2026-08-07', '2026-08-13', '14', 'Returned'],
        ['LB108', 'Neha', 'Machine Learning', 'Programming', '2026-08-08', '2026-08-17', '14', 'Returned'],
        ['LB109', 'Ajay', 'Python Basics', 'Programming', '2026-08-09', '2026-08-18', '14', 'Returned'],
        ['LB110', 'Kavya', 'Cloud Computing', 'Literature', '2026-08-10', '2026-08-19', '14', 'Returned'],
      ],
    },
    correct_index: 9, // Row 10 (Cloud Computing classified under Literature)
  },
  {
    question_text: '🚖 Taxi Ride — Distance/Time Mismatch: Find the ONE anomalous row.',
    options: {
      headers: ['Ride ID', 'Driver', 'Pickup', 'Drop', 'Distance km', 'Fare ₹', 'Start', 'End'],
      rows: [
        ['R101', 'Arun', 'Chennai Central', 'T Nagar', '7', '210', '09:00', '09:22'],
        ['R102', 'Priya', 'Adyar', 'Guindy', '9', '270', '09:30', '10:00'],
        ['R103', 'Kiran', 'Velachery', 'Tambaram', '18', '520', '10:10', '10:55'],
        ['R104', 'Meena', 'Anna Nagar', 'Mogappair', '8', '240', '11:00', '11:25'],
        ['R105', 'Rahul', 'Porur', 'Guindy', '11', '330', '11:30', '12:05'],
        ['R106', 'Divya', 'Mylapore', 'Adyar', '6', '190', '12:10', '12:30'],
        ['R107', 'Sanjay', 'T Nagar', 'Guindy', '5', '160', '13:00', '13:18'],
        ['R108', 'Neha', 'Tambaram', 'Chromepet', '9', '260', '14:00', '14:28'],
        ['R109', 'Ajay', 'Egmore', 'Nungambakkam', '5', '150', '15:00', '15:17'],
        ['R110', 'Kavya', 'Porur', 'Guindy', '3', '120', '16:00', '18:30'],
      ],
    },
    correct_index: 9, // Row 10 (3 km ride lasting 2.5 hours)
  },
  {
    question_text: '👨‍🎓 Student Attendance — Logical Mismatch: Find the ONE anomalous row.',
    options: {
      headers: ['Student ID', 'Student', 'Working Days', 'Present', 'Absent', 'Attendance %', 'Semester', 'Section'],
      rows: [
        ['S101', 'Rahul', '100', '92', '8', '92%', '4', 'A'],
        ['S102', 'Priya', '100', '85', '15', '85%', '3', 'B'],
        ['S103', 'Arjun', '100', '96', '4', '96%', '4', 'A'],
        ['S104', 'Meena', '100', '78', '22', '78%', '2', 'C'],
        ['S105', 'Kiran', '100', '88', '12', '88%', '3', 'A'],
        ['S106', 'Divya', '100', '91', '9', '91%', '4', 'B'],
        ['S107', 'Sanjay', '100', '84', '16', '84%', '2', 'A'],
        ['S108', 'Neha', '100', '95', '5', '95%', '4', 'C'],
        ['S109', 'Ajay', '100', '89', '11', '89%', '3', 'B'],
        ['S110', 'Kavya', '100', '94', '6', '84%', '4', 'A'],
      ],
    },
    correct_index: 9, // Row 10 (Present 94 + Absent 6 = 100, but attendance recorded as 84% instead of 94%)
  },
  {
    question_text: '🍔 Food Delivery — Location/Time Mismatch: Find the ONE anomalous row.',
    options: {
      headers: ['Order ID', 'Customer', 'Restaurant', 'Restaurant City', 'Delivery City', 'Order Time', 'Delivery Time', 'Distance km'],
      rows: [
        ['FD101', 'Rahul', 'Burger Hub', 'Chennai', 'Chennai', '12:05', '12:35', '6'],
        ['FD102', 'Priya', 'Pizza Point', 'Mumbai', 'Mumbai', '12:40', '13:15', '8'],
        ['FD103', 'Arjun', 'Spice House', 'Delhi', 'Delhi', '13:10', '13:45', '9'],
        ['FD104', 'Meena', 'Cafe 24', 'Pune', 'Pune', '13:30', '14:05', '7'],
        ['FD105', 'Kiran', 'Biryani Palace', 'Chennai', 'Chennai', '14:00', '14:40', '10'],
        ['FD106', 'Divya', 'Burger Hub', 'Bengaluru', 'Bengaluru', '14:20', '14:55', '8'],
        ['FD107', 'Sanjay', 'Pizza Point', 'Hyderabad', 'Hyderabad', '15:00', '15:35', '7'],
        ['FD108', 'Neha', 'Spice House', 'Mumbai', 'Mumbai', '15:30', '16:05', '6'],
        ['FD109', 'Ajay', 'Cafe 24', 'Pune', 'Pune', '16:00', '16:30', '5'],
        ['FD110', 'Kavya', 'Biryani Palace', 'Chennai', 'Chennai', '16:20', '16:00', '7'],
      ],
    },
    correct_index: 9, // Row 10 (Delivery time 16:00 earlier than order time 16:20)
  },
  {
    question_text: '📦 Warehouse — Stock Calculation Mismatch: Find the ONE anomalous row.',
    options: {
      headers: ['Item ID', 'Product', 'Category', 'Warehouse', 'Stock In', 'Stock Out', 'Balance', 'Reorder Level'],
      rows: [
        ['I101', 'Laptop', 'Electronics', 'WH01', '100', '20', '80', '30'],
        ['I102', 'Keyboard', 'Electronics', 'WH02', '150', '40', '110', '40'],
        ['I103', 'Monitor', 'Electronics', 'WH01', '80', '25', '55', '20'],
        ['I104', 'Chair', 'Furniture', 'WH03', '120', '50', '70', '30'],
        ['I105', 'Mouse', 'Electronics', 'WH02', '200', '75', '125', '50'],
        ['I106', 'Desk', 'Furniture', 'WH03', '90', '30', '60', '25'],
        ['I107', 'Printer', 'Electronics', 'WH01', '70', '20', '50', '20'],
        ['I108', 'Cabinet', 'Furniture', 'WH02', '100', '45', '55', '25'],
        ['I109', 'Laptop', 'Electronics', 'WH03', '180', '60', '120', '40'],
        ['I110', 'Keyboard', 'Electronics', 'WH01', '160', '50', '120', '40'],
      ],
    },
    correct_index: 9, // Row 10 (160 - 50 = 110, but balance is recorded as 120)
  },
  {
    question_text: '🎓 Student Academic — Department/Subject Mismatch: Find the ONE anomalous row.',
    options: {
      headers: ['Student ID', 'Student', 'Department', 'Subject', 'Semester', 'Admission', 'Graduation', 'Credits'],
      rows: [
        ['ST101', 'Rahul', 'AI&DS', 'Machine Learning', '4', '2024', '2028', '24'],
        ['ST102', 'Priya', 'CSE', 'Data Structures', '3', '2024', '2028', '22'],
        ['ST103', 'Arjun', 'ECE', 'Digital Electronics', '5', '2023', '2027', '24'],
        ['ST104', 'Meena', 'AI&DS', 'Deep Learning', '4', '2024', '2028', '23'],
        ['ST105', 'Kiran', 'CSE', 'DBMS', '4', '2024', '2028', '24'],
        ['ST106', 'Divya', 'IT', 'Computer Networks', '3', '2024', '2028', '21'],
        ['ST107', 'Sanjay', 'ECE', 'Microprocessors', '5', '2023', '2027', '23'],
        ['ST108', 'Neha', 'AI&DS', 'Python Programming', '2', '2025', '2029', '20'],
        ['ST109', 'Ajay', 'CSE', 'Operating Systems', '6', '2023', '2027', '24'],
        ['ST110', 'Kavya', 'AI&DS', 'Mechanical Design', '4', '2024', '2028', '23'],
      ],
    },
    correct_index: 9, // Row 10 (Mechanical Design does not fit AI&DS department)
  },
  {
    question_text: '🏨 Hotel Booking — Capacity/Date Mismatch: Find the ONE anomalous row.',
    options: {
      headers: ['Booking ID', 'Guest', 'Room Type', 'Max Guests', 'Booked Guests', 'Check-in', 'Check-out', 'Rate ₹'],
      rows: [
        ['BK101', 'Rahul', 'Single', '1', '1', 'Aug 01', 'Aug 03', '2500'],
        ['BK102', 'Priya', 'Deluxe', '2', '2', 'Aug 02', 'Aug 05', '4200'],
        ['BK103', 'Arjun', 'Suite', '4', '4', 'Aug 03', 'Aug 06', '7500'],
        ['BK104', 'Meena', 'Single', '1', '1', 'Aug 04', 'Aug 06', '2600'],
        ['BK105', 'Kiran', 'Deluxe', '2', '2', 'Aug 05', 'Aug 08', '4300'],
        ['BK106', 'Divya', 'Suite', '4', '4', 'Aug 06', 'Aug 09', '7600'],
        ['BK107', 'Sanjay', 'Single', '1', '1', 'Aug 07', 'Aug 10', '2500'],
        ['BK108', 'Neha', 'Deluxe', '2', '2', 'Aug 08', 'Aug 11', '4100'],
        ['BK109', 'Ajay', 'Suite', '4', '4', 'Aug 09', 'Aug 12', '7800'],
        ['BK110', 'Kavya', 'Single', '1', '4', 'Aug 10', 'Aug 12', '2500'],
      ],
    },
    correct_index: 9, // Row 10 (Single room allows max 1 guest but 4 guests booked)
  },
  {
    question_text: '🔧 Vehicle Service — Vehicle/Service Mismatch: Find the ONE anomalous row.',
    options: {
      headers: ['Vehicle ID', 'Owner', 'Vehicle Type', 'Service', 'Odometer km', 'Purchase Year', 'Service Year', 'Cost ₹'],
      rows: [
        ['VH101', 'Rahul', 'Petrol Bike', 'Oil Change', '24000', '2022', '2025', '1200'],
        ['VH102', 'Priya', 'Diesel Car', 'Engine Service', '48000', '2021', '2025', '8500'],
        ['VH103', 'Arjun', 'Electric Scooter', 'Battery Check', '12000', '2023', '2025', '2400'],
        ['VH104', 'Meena', 'Petrol Car', 'Brake Service', '35000', '2022', '2025', '4200'],
        ['VH105', 'Kiran', 'Bike', 'Chain Service', '29000', '2021', '2025', '1800'],
        ['VH106', 'Divya', 'Diesel SUV', 'Oil Change', '52000', '2020', '2025', '3500'],
        ['VH107', 'Sanjay', 'Electric Car', 'Battery Diagnostic', '41000', '2022', '2025', '3000'],
        ['VH108', 'Neha', 'Petrol Bike', 'Tyre Change', '18000', '2023', '2025', '2800'],
        ['VH109', 'Ajay', 'Diesel Car', 'Brake Service', '61000', '2019', '2025', '5000'],
        ['VH110', 'Kavya', 'Electric Scooter', 'Engine Oil Change', '9000', '2024', '2025', '1200'],
      ],
    },
    correct_index: 9, // Row 10 (Electric scooter does not have engine oil)
  },
  {
    question_text: '🚆 Train Journey — Route/Time Mismatch: Find the ONE anomalous row.',
    options: {
      headers: ['Ticket ID', 'Passenger', 'Train', 'Route', 'Boarding', 'Destination', 'Departure', 'Arrival'],
      rows: [
        ['T101', 'Rahul', 'TN01', 'Chennai–Madurai', 'Chennai', 'Madurai', '08:00', '13:00'],
        ['T102', 'Priya', 'TN02', 'Chennai–Coimbatore', 'Chennai', 'Coimbatore', '09:00', '14:00'],
        ['T103', 'Arjun', 'KA01', 'Bengaluru–Mysuru', 'Bengaluru', 'Mysuru', '10:00', '12:00'],
        ['T104', 'Meena', 'TN03', 'Chennai–Trichy', 'Chennai', 'Trichy', '11:00', '16:00'],
        ['T105', 'Kiran', 'TN01', 'Chennai–Madurai', 'Chennai', 'Madurai', '12:00', '17:00'],
        ['T106', 'Divya', 'TN04', 'Coimbatore–Chennai', 'Coimbatore', 'Chennai', '13:00', '18:00'],
        ['T107', 'Sanjay', 'KA01', 'Bengaluru–Mysuru', 'Bengaluru', 'Mysuru', '14:00', '16:00'],
        ['T108', 'Neha', 'TN05', 'Chennai–Pondicherry', 'Chennai', 'Pondicherry', '15:00', '17:00'],
        ['T109', 'Ajay', 'TN03', 'Chennai–Trichy', 'Chennai', 'Trichy', '16:00', '21:00'],
        ['T110', 'Kavya', 'TN01', 'Chennai–Madurai', 'Chennai', 'Madurai', '17:00', '15:00'],
      ],
    },
    correct_index: 9, // Row 10 (Arrival 15:00 earlier than departure 17:00)
  },
  {
    question_text: '🏋️‍♂️ Fitness — Measurement Mismatch: Find the ONE anomalous row.',
    options: {
      headers: ['User ID', 'Age', 'Weight kg', 'Steps', 'Heart Rate', 'Calories', 'Duration min', 'Workout'],
      rows: [
        ['FIT101', '24', '68', '8500', '78', '320', '65', 'Walking'],
        ['FIT102', '31', '74', '9200', '82', '360', '70', 'Jogging'],
        ['FIT103', '27', '62', '10500', '80', '410', '75', 'Running'],
        ['FIT104', '29', '70', '7800', '76', '300', '60', 'Walking'],
        ['FIT105', '35', '81', '6500', '85', '340', '55', 'Cycling'],
        ['FIT106', '42', '79', '6200', '80', '290', '52', 'Walking'],
        ['FIT107', '26', '65', '11000', '84', '430', '82', 'Running'],
        ['FIT108', '33', '72', '9000', '88', '390', '70', 'Jogging'],
        ['FIT109', '30', '67', '8900', '81', '335', '66', 'Walking'],
        ['FIT110', '40', '77', '200', '82', '700', '60', 'Walking'],
      ],
    },
    correct_index: 9, // Row 10 (200 steps with 700 calories is inconsistent outlier)
  },
  {
    question_text: '📱 Mobile Usage — Timestamp/Frequency Mismatch: Find the ONE anomalous row.',
    options: {
      headers: ['User ID', 'Date', 'Data GB', 'Calls', 'Call Min', 'Login', 'Logout', 'Device'],
      rows: [
        ['M101', 'Aug 01', '2.5', '12', '45', '09:00', '18:00', 'Android'],
        ['M102', 'Aug 01', '3.1', '15', '52', '08:30', '17:30', 'iPhone'],
        ['M103', 'Aug 02', '2.8', '10', '40', '10:00', '19:00', 'Android'],
        ['M104', 'Aug 02', '3.0', '18', '60', '09:00', '18:00', 'Android'],
        ['M105', 'Aug 03', '2.9', '14', '48', '08:00', '17:00', 'iPhone'],
        ['M106', 'Aug 03', '3.2', '16', '55', '09:00', '18:00', 'Android'],
        ['M107', 'Aug 04', '3.5', '17', '50', '10:00', '19:00', 'iPhone'],
        ['M108', 'Aug 04', '2.7', '11', '42', '09:30', '18:30', 'Android'],
        ['M109', 'Aug 05', '3.2', '13', '47', '11:00', '20:00', 'iPhone'],
        ['M110', 'Aug 05', '35.0', '13', '47', '11:00', '20:00', 'iPhone'],
      ],
    },
    correct_index: 9, // Row 10 (35 GB extreme data usage outlier)
  },
  {
    question_text: '🛍️ E-commerce — Price/Quantity/Total Mismatch: Find the ONE anomalous row.',
    options: {
      headers: ['Order ID', 'Product', 'Quantity', 'Unit Price ₹', 'Discount ₹', 'Recorded Total ₹', 'Category', 'Payment'],
      rows: [
        ['ORD101', 'Laptop', '2', '50000', '5000', '95000', 'Electronics', 'Paid'],
        ['ORD102', 'Mouse', '5', '500', '100', '2400', 'Electronics', 'Paid'],
        ['ORD103', 'Keyboard', '3', '1200', '200', '3400', 'Electronics', 'Paid'],
        ['ORD104', 'Monitor', '2', '15000', '1000', '29000', 'Electronics', 'Paid'],
        ['ORD105', 'Headphones', '4', '2500', '500', '9500', 'Audio', 'Paid'],
        ['ORD106', 'Webcam', '2', '3000', '200', '5800', 'Electronics', 'Paid'],
        ['ORD107', 'Tablet', '1', '25000', '2000', '23000', 'Electronics', 'Paid'],
        ['ORD108', 'Phone', '2', '30000', '3000', '57000', 'Electronics', 'Paid'],
        ['ORD109', 'Printer', '1', '12000', '1000', '11000', 'Electronics', 'Paid'],
        ['ORD110', 'Smartwatch', '3', '5000', '500', '14000', 'Wearable', 'Paid'],
      ],
    },
    correct_index: 9, // Row 10 (3 * 5000 - 500 = 14500, recorded total is 14000)
  },
];

async function seedRound4() {
  console.log('Inserting 13 Round 4 Data Challenge questions into Supabase...');

  const { data: events, error: eventsErr } = await supabase.from('events').select('id, name');
  if (eventsErr || !events || events.length === 0) {
    console.error('No events found to attach questions to:', eventsErr);
    return;
  }

  for (const event of events) {
    console.log(`Processing event: ${event.name} (${event.id})`);

    // Delete existing placeholder data challenge questions or keep them?
    // Let's insert all 13 questions
    const inserts = round4QuestionsData.map((q) => ({
      event_id: event.id,
      question_text: q.question_text,
      options: q.options,
      correct_index: q.correct_index,
    }));

    const { data: inserted, error: insertErr } = await supabase
      .from('data_challenge_questions')
      .insert(inserts)
      .select('id, question_text, correct_index');

    if (insertErr) {
      console.error(`Error inserting into event ${event.name}:`, insertErr);
    } else {
      console.log(`Successfully inserted ${inserted?.length} questions into event ${event.name}!`);
    }
  }
}

if (require.main === module) {
  seedRound4().catch(console.error);
}
