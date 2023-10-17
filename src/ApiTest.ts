export default function handleApiReq(req: Record<string, any>, res: Record<string, any>) {
    let message = req.body.message;

    res.json({ message: `Hello from API` });
    console.log(`Received ${message}`);
}