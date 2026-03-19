const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

if (!pkg.dependencies['@radix-ui/react-checkbox']) {
  pkg.dependencies['@radix-ui/react-checkbox'] = '^1.1.2';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  console.log('Added @radix-ui/react-checkbox to package.json');
} else {
  console.log('Already present:', pkg.dependencies['@radix-ui/react-checkbox']);
}
