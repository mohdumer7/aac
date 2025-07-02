const fs = require('fs');
const path = require('path');

// Fix [formType]/route.ts
const formTypeRoutePath = path.join(__dirname, 'src', 'app', 'api', 'hrms', 'forms', '[formType]', 'route.ts');
console.log(`Fixing ${formTypeRoutePath}...`);

if (fs.existsSync(formTypeRoutePath)) {
  let content = fs.readFileSync(formTypeRoutePath, 'utf8');
  
  // Fix GET handler
  content = content.replace(
    /export async function GET\(\s*request: NextRequest,\s*{\s*params\s*}:\s*{\s*params:\s*{\s*formType:\s*string\s*}\s*}\s*\)\s*{\s*\/\/[^\n]*\s*const formType = params\.formType;/g,
    `export async function GET(
  request: NextRequest,
  { params }: { params: { formType: string } }
) {
  // Get the params object first
  const resolvedParams = await params;
  const formType = resolvedParams.formType;`
  );
  
  // Fix POST handler
  content = content.replace(
    /export async function POST\(\s*request: NextRequest,\s*{\s*params\s*}:\s*{\s*params:\s*{\s*formType:\s*string\s*}\s*}\s*\)\s*{\s*\/\/[^\n]*\s*const formType = params\.formType;/g,
    `export async function POST(
  request: NextRequest,
  { params }: { params: { formType: string } }
) {
  // Get the params object first
  const resolvedParams = await params;
  const formType = resolvedParams.formType;`
  );
  
  fs.writeFileSync(formTypeRoutePath, content);
  console.log('✅ Fixed [formType]/route.ts');
} else {
  console.error('❌ Could not find [formType]/route.ts');
}

// Fix [formType]/[id]/route.ts
const idRoutePath = path.join(__dirname, 'src', 'app', 'api', 'hrms', 'forms', '[formType]', '[id]', 'route.ts');
console.log(`Fixing ${idRoutePath}...`);

if (fs.existsSync(idRoutePath)) {
  let content = fs.readFileSync(idRoutePath, 'utf8');
  
  // Fix GET handler
  content = content.replace(
    /export async function GET\(\s*request: NextRequest,\s*{\s*params\s*}:\s*{\s*params:\s*{\s*formType:\s*string;\s*id:\s*string\s*}\s*}\s*\)\s*{\s*\/\/[^\n]*\s*const formType = params\.formType;\s*const id = params\.id;/g,
    `export async function GET(
  request: NextRequest,
  { params }: { params: { formType: string; id: string } }
) {
  // Get the params object first
  const resolvedParams = await params;
  const formType = resolvedParams.formType;
  const id = resolvedParams.id;`
  );
  
  // Fix PUT handler
  content = content.replace(
    /export async function PUT\(\s*request: NextRequest,\s*{\s*params\s*}:\s*{\s*params:\s*{\s*formType:\s*string;\s*id:\s*string\s*}\s*}\s*\)\s*{\s*\/\/[^\n]*\s*const formType = params\.formType;\s*const id = params\.id;/g,
    `export async function PUT(
  request: NextRequest,
  { params }: { params: { formType: string; id: string } }
) {
  // Get the params object first
  const resolvedParams = await params;
  const formType = resolvedParams.formType;
  const id = resolvedParams.id;`
  );
  
  // Fix DELETE handler
  content = content.replace(
    /export async function DELETE\(\s*request: NextRequest,\s*{\s*params\s*}:\s*{\s*params:\s*{\s*formType:\s*string;\s*id:\s*string\s*}\s*}\s*\)\s*{\s*\/\/[^\n]*\s*const formType = params\.formType;\s*const id = params\.id;/g,
    `export async function DELETE(
  request: NextRequest,
  { params }: { params: { formType: string; id: string } }
) {
  // Get the params object first
  const resolvedParams = await params;
  const formType = resolvedParams.formType;
  const id = resolvedParams.id;`
  );
  
  fs.writeFileSync(idRoutePath, content);
  console.log('✅ Fixed [formType]/[id]/route.ts');
} else {
  console.error('❌ Could not find [formType]/[id]/route.ts');
}

// Fix [formType]/[id]/save-draft/route.ts
const saveDraftRoutePath = path.join(__dirname, 'src', 'app', 'api', 'hrms', 'forms', '[formType]', '[id]', 'save-draft', 'route.ts');
console.log(`Fixing ${saveDraftRoutePath}...`);

if (fs.existsSync(saveDraftRoutePath)) {
  let content = fs.readFileSync(saveDraftRoutePath, 'utf8');
  
  // Fix POST handler
  content = content.replace(
    /export async function POST\(\s*request: NextRequest,\s*{\s*params\s*}:\s*{\s*params:\s*{\s*formType:\s*string;\s*id:\s*string\s*}\s*}\s*\)\s*{\s*\/\/[^\n]*\s*const formType = params\.formType;\s*const id = params\.id;/g,
    `export async function POST(
  request: NextRequest,
  { params }: { params: { formType: string; id: string } }
) {
  // Get the params object first
  const resolvedParams = await params;
  const formType = resolvedParams.formType;
  const id = resolvedParams.id;`
  );
  
  fs.writeFileSync(saveDraftRoutePath, content);
  console.log('✅ Fixed [formType]/[id]/save-draft/route.ts');
} else {
  console.error('❌ Could not find [formType]/[id]/save-draft/route.ts');
}

console.log('✅ All files processed. Please restart your Next.js server.');
