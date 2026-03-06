# PowerShell script to create timeline tables
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/ink_spirit"

npx prisma db push --schema="d:\Code\ink-spirit-blog\ink-spirit-blog\backend\prisma\schema.prisma" --skip-generate
