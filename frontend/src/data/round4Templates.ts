export interface Round4Template {
  name: string;
  question_text: string;
  headers: string[];
  rows: string[][];
  correct_index: number;
}

export const ROUND_4_TEMPLATES: Round4Template[] = [
  {
    name: '🏦 Bank Account Dataset',
    question_text: '🏦 Bank Account Dataset — Spot the Anomalous Row',
    headers: ['Row', 'Account ID', 'Customer', 'Type', 'Status', 'Opened', 'Closed', 'Last Transaction', 'Branch'],
    rows: [
      ['1', 'SAV-731', 'Ananya Bose', 'Savings', 'Active', '2021', '—', '2026-08-11', 'Kolkata'],
      ['2', 'CUR-284', 'Vikram Iyer', 'Current', 'Active', '2020', '—', '2026-08-14', 'Chennai'],
      ['3', 'SAV-916', 'Farah Khan', 'Savings', 'Closed', '2018', '2025', '2024-10-03', 'Mumbai'],
      ['4', 'CUR-507', 'Manoj Pillai', 'Current', 'Closed', '2019', '2023', '2025-07-18', 'Kochi'],
      ['5', 'SAV-362', 'Ishita Roy', 'Savings', 'Active', '2024', '—', '2026-08-15', 'Delhi'],
      ['6', 'CUR-845', 'Ritesh Jain', 'Current', 'Active', '2022', '—', '2026-08-09', 'Jaipur'],
      ['7', 'SAV-129', 'Sneha Das', 'Savings', 'Closed', '2020', '2024', '2024-02-21', 'Pune'],
      ['8', 'CUR-673', 'Yusuf Ali', 'Current', 'Active', '2021', '—', '2026-08-16', 'Hyderabad'],
      ['9', 'SAV-458', 'Lavanya R', 'Savings', 'Active', '2023', '—', '2026-08-12', 'Coimbatore'],
      ['10', 'CUR-792', 'Nitin Sood', 'Current', 'Closed', '2017', '2022', '2021-12-30', 'Bengaluru'],
    ],
    correct_index: 3, // Row 4
  },
  {
    name: '📚 Library Dataset',
    question_text: '📚 Library Dataset — Spot the Anomalous Row',
    headers: ['Row', 'Loan ID', 'Member', 'Book', 'Genre', 'Issued', 'Returned', 'Limit', 'Fine ₹'],
    rows: [
      ['1', 'LN-41', 'Aarav Sen', 'Algorithms', 'Computer Science', 'Aug 01', 'Aug 09', '14 days', '0'],
      ['2', 'LN-52', 'Maya Thomas', 'The Alchemist', 'Fiction', 'Aug 02', 'Aug 12', '14 days', '0'],
      ['3', 'LN-63', 'Kabir Shah', 'Digital Logic', 'Engineering', 'Aug 03', 'Aug 10', '14 days', '0'],
      ['4', 'LN-74', 'Nandhini V', 'Pride and Prejudice', 'Fiction', 'Aug 04', 'Aug 16', '14 days', '0'],
      ['5', 'LN-85', 'Zoya Mirza', 'Cloud Computing', 'Computer Science', 'Aug 05', 'Aug 18', '14 days', '0'],
      ['6', 'LN-96', 'Harish Babu', 'Thermodynamics', 'Engineering', 'Aug 06', 'Aug 15', '14 days', '0'],
      ['7', 'LN-107', 'Rehan Joseph', 'Data Mining', 'History', 'Aug 07', 'Aug 17', '14 days', '0'],
      ['8', 'LN-118', 'Keerthi Raj', 'Wings of Fire', 'Biography', 'Aug 08', 'Aug 19', '14 days', '0'],
      ['9', 'LN-129', 'Om Prakash', 'Computer Networks', 'Computer Science', 'Aug 09', 'Aug 20', '14 days', '0'],
      ['10', 'LN-140', 'Tara Singh', 'Organic Chemistry', 'Science', 'Aug 10', 'Aug 22', '14 days', '0'],
    ],
    correct_index: 6, // Row 7
  },
  {
    name: '🚖 Taxi Ride Dataset',
    question_text: '🚖 Taxi Ride Dataset — Spot the Anomalous Row',
    headers: ['Row', 'Trip Code', 'Driver', 'Pickup', 'Drop', 'Distance km', 'Traffic', 'Fare ₹', 'Start', 'End'],
    rows: [
      ['1', 'TX-801', 'Balaji K', 'Adyar', 'Guindy', '8', 'Medium', '248', '08:15', '08:42'],
      ['2', 'TX-654', 'Fatima Noor', 'Tambaram', 'Chromepet', '6', 'Low', '190', '09:00', '11:45'],
      ['3', 'TX-923', 'Gautham R', 'T Nagar', 'Mylapore', '5', 'High', '175', '10:10', '10:35'],
      ['4', 'TX-477', 'Pooja Menon', 'Velachery', 'Adyar', '7', 'Medium', '220', '11:00', '11:25'],
      ['5', 'TX-312', 'Danish Khan', 'Anna Nagar', 'Egmore', '9', 'High', '290', '12:20', '12:55'],
      ['6', 'TX-568', 'Reshma Paul', 'Porur', 'Koyambedu', '10', 'Medium', '310', '13:05', '13:38'],
      ['7', 'TX-739', 'Suraj Nair', 'Saidapet', 'Guindy', '4', 'Low', '140', '14:10', '14:23'],
      ['8', 'TX-246', 'Bhavana S', 'Nungambakkam', 'T Nagar', '3', 'Medium', '115', '15:00', '15:14'],
      ['9', 'TX-895', 'Imran Sheikh', 'Perambur', 'Egmore', '8', 'High', '260', '16:15', '16:48'],
      ['10', 'TX-381', 'Janani M', 'Mylapore', 'Besant Nagar', '6', 'Medium', '205', '17:30', '17:52'],
    ],
    correct_index: 1, // Row 2
  },
  {
    name: '👨‍🎓 Student Attendance Dataset',
    question_text: '👨‍🎓 Student Attendance Dataset — Spot the Anomalous Row',
    headers: ['Row', 'Roll No', 'Student', 'Sem', 'Sec', 'Working', 'Present', 'Absent', 'Attendance'],
    rows: [
      ['1', 'ADS24101', 'Dev Patel', '4', 'A', '96', '89', '7', '92.7%'],
      ['2', 'CSE23114', 'Rhea Kapoor', '6', 'B', '96', '82', '14', '85.4%'],
      ['3', 'IT24207', 'Aman Verma', '4', 'C', '96', '91', '5', '94.8%'],
      ['4', 'ECE22119', 'Sonal Gupta', '8', 'A', '96', '76', '20', '79.2%'],
      ['5', 'ADS24122', 'Karthik S', '4', 'B', '96', '88', '8', '91.7%'],
      ['6', 'CSE23131', 'Nisha Rao', '6', 'A', '96', '90', '6', '93.8%'],
      ['7', 'IT24215', 'Pranav M', '4', 'C', '96', '84', '12', '87.5%'],
      ['8', 'ECE22108', 'Ira Nair', '8', 'B', '96', '93', '3', '96.9%'],
      ['9', 'ADS24135', 'Mohan Raj', '4', 'A', '96', '86', '10', '94.8%'],
      ['10', 'CSE23142', 'Simran K', '6', 'B', '96', '80', '16', '83.3%'],
    ],
    correct_index: 8, // Row 9
  },
  {
    name: '🍔 Food Delivery Dataset',
    question_text: '🍔 Food Delivery Dataset — Spot the Anomalous Row',
    headers: ['Row', 'Order No', 'Customer', 'Restaurant', 'City', 'Items', 'Ordered', 'Picked', 'Delivered', 'Rating'],
    rows: [
      ['1', 'FD-2201', 'Rohan Das', 'Urban Tadka', 'Chennai', '2', '12:05', '12:20', '12:42', '4.7'],
      ['2', 'FD-2202', 'Elina George', 'Pizza Loft', 'Kochi', '1', '12:40', '12:55', '13:28', '4.5'],
      ['3', 'FD-2203', 'Sahil Arora', 'Bowl Story', 'Delhi', '3', '13:10', '13:24', '13:51', '4.8'],
      ['4', 'FD-2204', 'Megha Iyer', 'Spice Route', 'Bengaluru', '2', '13:35', '13:50', '14:22', '4.6'],
      ['5', 'FD-2205', 'Armaan Qureshi', 'Burger Lab', 'Mumbai', '2', '14:00', '14:18', '13:55', '4.4'],
      ['6', 'FD-2206', 'Lydia Paul', 'Dosa Corner', 'Chennai', '4', '14:25', '14:40', '15:12', '4.9'],
      ['7', 'FD-2207', 'Tushar Jain', 'Curry House', 'Pune', '1', '15:00', '15:16', '15:41', '4.3'],
      ['8', 'FD-2208', 'Naveena R', 'Rice Bowl', 'Hyderabad', '2', '15:20', '15:35', '16:05', '4.7'],
      ['9', 'FD-2209', 'Sameer Ali', 'Grill Station', 'Delhi', '3', '16:10', '16:28', '16:58', '4.5'],
      ['10', 'FD-2210', 'Isha S', 'Noodle Nest', 'Kolkata', '2', '16:40', '16:55', '17:21', '4.6'],
    ],
    correct_index: 4, // Row 5
  },
  {
    name: '📦 Warehouse Dataset',
    question_text: '📦 Warehouse Dataset — Spot the Anomalous Row',
    headers: ['Row', 'SKU', 'Item', 'Category', 'Zone', 'Opening', 'Received', 'Dispatched', 'Closing'],
    rows: [
      ['1', 'WH-A19', 'USB Hub', 'Electronics', 'A2', '120', '40', '55', '120'],
      ['2', 'WH-B07', 'Office Chair', 'Furniture', 'B1', '60', '20', '18', '62'],
      ['3', 'WH-C34', 'LED Monitor', 'Electronics', 'C3', '85', '30', '40', '75'],
      ['4', 'WH-D12', 'Notebook Pack', 'Stationery', 'D2', '200', '100', '120', '180'],
      ['5', 'WH-E88', 'Wireless Mouse', 'Electronics', 'A1', '150', '50', '70', '130'],
      ['6', 'WH-F25', 'Storage Rack', 'Furniture', 'B4', '40', '10', '8', '42'],
      ['7', 'WH-G61', 'Printer Ink', 'Office', 'D1', '90', '60', '75', '75'],
      ['8', 'WH-H03', 'Laptop Stand', 'Electronics', 'C2', '110', '25', '45', '90'],
      ['9', 'WH-J47', 'Desk Lamp', 'Office', 'B3', '70', '30', '35', '65'],
      ['10', 'WH-K90', 'HDMI Cable', 'Electronics', 'A3', '180', '40', '100', '120'],
    ],
    correct_index: 0, // Row 1
  },
  {
    name: '🎓 Student Academic Dataset',
    question_text: '🎓 Student Academic Dataset — Spot the Anomalous Row',
    headers: ['Row', 'Student ID', 'Name', 'Department', 'Sem', 'Elective', 'Credits', 'CGPA', 'Admission'],
    rows: [
      ['1', 'UNI-501', 'Aditya Bose', 'AI & DS', '4', 'Machine Learning', '4', '8.4', '2024'],
      ['2', 'UNI-502', 'Fathima S', 'CSE', '6', 'Distributed Systems', '3', '8.1', '2023'],
      ['3', 'UNI-503', 'Joel Mathew', 'ECE', '5', 'Embedded Systems', '4', '7.9', '2024'],
      ['4', 'UNI-504', 'Prisha Jain', 'IT', '4', 'Cloud Computing', '3', '8.6', '2024'],
      ['5', 'UNI-505', 'Vishal Rao', 'AI & DS', '4', 'Data Visualization', '3', '8.0', '2024'],
      ['6', 'UNI-506', 'Anjali P', 'CSE', '6', 'Compiler Design', '4', '8.3', '2023'],
      ['7', 'UNI-507', 'Naveen Das', 'ECE', '5', 'Signal Processing', '4', '7.8', '2024'],
      ['8', 'UNI-508', 'Mira Kapoor', 'AI & DS', '4', 'Structural Engineering', '3', '8.5', '2024'],
      ['9', 'UNI-509', 'Raghav Menon', 'IT', '4', 'Web Technologies', '3', '8.2', '2024'],
      ['10', 'UNI-510', 'Sana Ali', 'CSE', '6', 'Database Security', '3', '8.7', '2023'],
    ],
    correct_index: 7, // Row 8
  },
  {
    name: '🏨 Hotel Booking Dataset',
    question_text: '🏨 Hotel Booking Dataset — Spot the Anomalous Row',
    headers: ['Row', 'Reservation', 'Guest', 'City', 'Room', 'Capacity', 'Guests', 'Check-in', 'Check-out', 'Nights'],
    rows: [
      ['1', 'HT-771', 'Yash Gupta', 'Goa', 'Deluxe', '2', '2', 'Aug 02', 'Aug 05', '3'],
      ['2', 'HT-772', 'Ayesha Khan', 'Chennai', 'Suite', '4', '3', 'Aug 03', 'Aug 06', '3'],
      ['3', 'HT-773', 'Ravi Shankar', 'Jaipur', 'Single', '1', '3', 'Aug 04', 'Aug 06', '2'],
      ['4', 'HT-774', 'Leena Roy', 'Kochi', 'Twin', '2', '2', 'Aug 05', 'Aug 08', '3'],
      ['5', 'HT-775', 'Varun S', 'Mumbai', 'Deluxe', '2', '1', 'Aug 06', 'Aug 09', '3'],
      ['6', 'HT-776', 'Nikita Paul', 'Pune', 'Suite', '4', '4', 'Aug 07', 'Aug 10', '3'],
      ['7', 'HT-777', 'Dheeraj K', 'Bengaluru', 'Single', '1', '1', 'Aug 08', 'Aug 11', '3'],
      ['8', 'HT-778', 'Rina Das', 'Delhi', 'Twin', '2', '2', 'Aug 09', 'Aug 12', '3'],
      ['9', 'HT-779', 'Faiz Ahmed', 'Goa', 'Deluxe', '2', '2', 'Aug 10', 'Aug 13', '3'],
      ['10', 'HT-780', 'Pavithra M', 'Chennai', 'Suite', '4', '3', 'Aug 11', 'Aug 14', '3'],
    ],
    correct_index: 2, // Row 3
  },
  {
    name: '🔧 Vehicle Service Dataset',
    question_text: '🔧 Vehicle Service Dataset — Spot the Anomalous Row',
    headers: ['Row', 'Service ID', 'Owner', 'Vehicle', 'Fuel', 'Odometer', 'Service Type'],
    rows: [
      ['1', 'VS-101', 'Ashwin Kumar', 'Honda City', 'Petrol', '42500', 'Oil & Filter'],
      ['2', 'VS-102', 'Saira Ahmed', 'TVS Apache', 'Petrol', '18900', 'Chain Adjustment'],
      ['3', 'VS-103', 'Kunal Shah', 'Tata Nexon EV', 'Electric', '31200', 'Battery Diagnostic'],
      ['4', 'VS-104', 'Revathi R', 'Hyundai Creta', 'Diesel', '56700', 'Brake Service'],
      ['5', 'VS-105', 'Irfan Ali', 'Ather 450X', 'Electric', '14600', 'Software Check'],
      ['6', 'VS-106', 'Madhav P', 'Ola S1 Pro', 'Electric', '11800', 'Engine Oil Replacement'],
      ['7', 'VS-107', 'Charu Jain', 'Royal Enfield', 'Petrol', '27400', 'Oil Change'],
      ['8', 'VS-108', 'Basil George', 'Maruti Baleno', 'Petrol', '39800', 'Tyre Rotation'],
      ['9', 'VS-109', 'Tanvi S', 'Mahindra XUV', 'Diesel', '63000', 'Engine Service'],
      ['10', 'VS-110', 'Hari N', 'TVS iQube', 'Electric', '9500', 'Brake Inspection'],
    ],
    correct_index: 5, // Row 6
  },
  {
    name: '🚆 Train Journey Dataset',
    question_text: '🚆 Train Journey Dataset — Spot the Anomalous Row',
    headers: ['Row', 'PNR', 'Passenger', 'Train', 'Route', 'Departure', 'Arrival'],
    rows: [
      ['1', 'PNR501', 'Aditi Rao', '12631', 'Chennai–Madurai', '06:30', '12:15'],
      ['2', 'PNR502', 'Nikhil Das', '12028', 'Bengaluru–Mysuru', '08:00', '10:10'],
      ['3', 'PNR503', 'Sanjana K', '12675', 'Chennai–Coimbatore', '09:15', '15:40'],
      ['4', 'PNR504', 'Imtiaz Ali', '16322', 'Ernakulam–Chennai', '10:00', '19:20'],
      ['5', 'PNR505', 'Preethi M', '12653', 'Chennai–Trichy', '11:30', '16:10'],
      ['6', 'PNR506', 'Rohit Jain', '16592', 'Pune–Mumbai', '13:00', '16:20'],
      ['7', 'PNR507', 'Mitali Sen', '12007', 'Delhi–Chandigarh', '14:15', '17:30'],
      ['8', 'PNR508', 'Arvind K', '22637', 'Mysuru–Chennai', '15:00', '22:45'],
      ['9', 'PNR509', 'Shreya Paul', '16128', 'Chennai–Guruvayur', '16:30', '05:15'],
      ['10', 'PNR510', 'Farhan Noor', '12622', 'Coimbatore–Chennai', '18:00', '16:45'],
    ],
    correct_index: 9, // Row 10
  },
  {
    name: '🏋️‍♂️ Fitness Dataset',
    question_text: '🏋️‍♂️ Fitness Dataset — Spot the Anomalous Row',
    headers: ['Row', 'Profile', 'Name', 'Age', 'Workout', 'Duration', 'Steps', 'Avg HR', 'Calories'],
    rows: [
      ['1', 'FT-31', 'Aravind S', '26', 'Jogging', '50', '7200', '132', '480'],
      ['2', 'FT-32', 'Hema R', '34', 'Cycling', '45', '5000', '125', '390'],
      ['3', 'FT-33', 'Zubin Khan', '29', 'Walking', '60', '8100', '118', '410'],
      ['4', 'FT-34', 'Lakshmi P', '31', 'Walking', '55', '250', '112', '680'],
      ['5', 'FT-35', 'Chetan Rao', '38', 'Running', '40', '6800', '148', '560'],
      ['6', 'FT-36', 'Nila Bose', '24', 'Jogging', '35', '5400', '136', '420'],
      ['7', 'FT-37', 'Bharath K', '42', 'Cycling', '50', '4800', '122', '430'],
      ['8', 'FT-38', 'Riya Menon', '27', 'Running', '45', '7100', '152', '590'],
      ['9', 'FT-39', 'Kishore V', '36', 'Walking', '65', '8600', '115', '440'],
      ['10', 'FT-40', 'Asha Devi', '30', 'Jogging', '42', '6000', '140', '455'],
    ],
    correct_index: 3, // Row 4
  },
  {
    name: '📱 Mobile Usage Dataset',
    question_text: '📱 Mobile Usage Dataset — Spot the Anomalous Row',
    headers: ['Row', 'User Tag', 'Date', 'Device', 'Screen Hours', 'Data GB', 'Calls', 'Call Minutes'],
    rows: [
      ['1', 'MB-801', 'Aug 12', 'Android', '5.2', '2.8', '14', '46'],
      ['2', 'MB-802', 'Aug 12', 'iOS', '4.7', '3.1', '11', '38'],
      ['3', 'MB-803', 'Aug 13', 'Android', '6.0', '3.5', '18', '55'],
      ['4', 'MB-804', 'Aug 13', 'Android', '4.9', '2.6', '12', '41'],
      ['5', 'MB-805', 'Aug 14', 'iOS', '5.5', '3.3', '15', '49'],
      ['6', 'MB-806', 'Aug 14', 'Android', '5.1', '2.9', '13', '44'],
      ['7', 'MB-807', 'Aug 15', 'iOS', '5.8', '38.7', '16', '51'],
      ['8', 'MB-808', 'Aug 15', 'Android', '4.6', '2.4', '10', '35'],
      ['9', 'MB-809', 'Aug 16', 'iOS', '5.3', '3.0', '14', '47'],
      ['10', 'MB-810', 'Aug 16', 'Android', '6.1', '3.6', '19', '58'],
    ],
    correct_index: 6, // Row 7
  },
  {
    name: '🛍️ E-commerce Dataset',
    question_text: '🛍️ E-commerce Dataset — Spot the Anomalous Row',
    headers: ['Row', 'Order Ref', 'Buyer', 'Product', 'Qty', 'Unit ₹', 'Discount ₹', 'Shipping ₹', 'Paid ₹'],
    rows: [
      ['1', 'EC-901', 'Rhea Thomas', 'Wireless Earbuds', '2', '3000', '300', '100', '5800'],
      ['2', 'EC-902', 'Aakash Nair', 'Smartwatch', '3', '4500', '500', '150', '12800'],
      ['3', 'EC-903', 'Mansi Kapoor', 'Mechanical Keyboard', '1', '6000', '600', '100', '5500'],
      ['4', 'EC-904', 'Danish Paul', 'Portable SSD', '2', '5000', '750', '100', '9350'],
      ['5', 'EC-905', 'Sonia R', 'Gaming Mouse', '4', '1500', '200', '120', '5920'],
      ['6', 'EC-906', 'Rajat Bose', 'Monitor Arm', '1', '3800', '300', '100', '3600'],
      ['7', 'EC-907', 'Elena Joseph', 'Tablet', '2', '22000', '2000', '200', '42200'],
      ['8', 'EC-908', 'Naveed S', 'Bluetooth Speaker', '3', '2200', '300', '100', '6400'],
      ['9', 'EC-909', 'Tanya Gupta', 'Webcam', '2', '2500', '250', '80', '4830'],
      ['10', 'EC-910', 'Kiran Mathew', 'Laptop Stand', '5', '1200', '400', '100', '5700'],
    ],
    correct_index: 1, // Row 2
  },
];
