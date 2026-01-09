// Script to update all fetch calls from buildAuthHeaders to credentials: 'include'
// This script will be run manually to update all files

const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    'd:/ODOTECH/web/ODOTECH_Frontend/src/pages/Sales.tsx',
    'd:/ODOTECH/web/ODOTECH_Frontend/src/pages/Renewals.tsx',
    'd:/ODOTECH/web/ODOTECH_Frontend/src/pages/Projects.tsx',
    'd:/ODOTECH/web/ODOTECH_Frontend/src/pages/ExpenseRenewals.tsx',
    'd:/ODOTECH/web/ODOTECH_Frontend/src/pages/Customers.tsx',
    'd:/ODOTECH/web/ODOTECH_Frontend/src/pages/Accounts.tsx',
    'd:/ODOTECH/web/ODOTECH_Frontend/src/components/salesDasboard/ProjectDetail.tsx',
    'd:/ODOTECH/web/ODOTECH_Frontend/src/components/projectsDasboard/helper/useProjectTasks.ts',
    'd:/ODOTECH/web/ODOTECH_Frontend/src/components/customersDashboard/CustomerDetail.tsx',
];

filesToUpdate.forEach(filePath => {
    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Pattern 1: { headers: buildAuthHeaders() }
        content = content.replace(/\{\s*headers:\s*buildAuthHeaders\(\)\s*\}/g, '{ credentials: \'include\' }');

        // Pattern 2: { headers: buildAuthHeaders({ 'Content-Type': 'application/json' }) }
        content = content.replace(/\{\s*headers:\s*buildAuthHeaders\(\s*\{\s*'Content-Type':\s*'application\/json'\s*\}\s*\)\s*\}/g,
            '{ headers: { \'Content-Type\': \'application/json\' }, credentials: \'include\' }');

        // Pattern 3: { ...buildAuthHeaders(), 'Content-Type': 'application/json' }
        content = content.replace(/\{\s*\.\.\.buildAuthHeaders\(\),\s*'Content-Type':\s*'application\/json'\s*\}/g,
            '{ \'Content-Type\': \'application/json\' }, credentials: \'include\'');

        // Remove buildAuthHeaders import if it's the only import from auth
        // This is more complex, so we'll keep it for now

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Updated: ${path.basename(filePath)}`);
    } catch (error) {
        console.error(`✗ Error updating ${filePath}:`, error.message);
    }
});

console.log('\nDone! Please review the changes.');
