This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:
For socket and server cd src/server; node socket-server.js
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



## IMPORTANT Steps for starting MONGO DB In replica ENV
Step: 1
//start the mongo server in replica server
PS E:\AceroApplications> & "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "E:\AceroApplications\data\27017" --replSet rs

Step 2:
//start mongo shell
PS E:\AceroApplications> c:\Users\deployadmin\Downloads\mongosh-2.5.2-win32-x64\mongosh-2.5.2-win32-x64\bin\mongosh.exe

if you see 
rs [direct: primary] test>  
"rs" here means the name of the replica set, then it works
else in the mongo shell run rs.initiate()