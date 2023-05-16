export async function readFileBuffer(file: File): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.addEventListener("loadend", () => resolve(new Uint8Array(reader.result as ArrayBuffer)))
        reader.addEventListener("error", reject)

        reader.readAsArrayBuffer(file)
    })
}