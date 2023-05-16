import { $, type QwikChangeEvent, component$, useStore, useId, type QwikDragEvent, useSignal } from "@builder.io/qwik";
import { readFileBuffer } from "~/utils/banner.utils";
import init, { parseFile, initialize } from "wasm-html-ad-viewer"
import { SiAdobe, SiGoogle } from "@qwikest/icons/simpleicons"
import { HiLinkOutline, HiArrowUpTrayOutline } from "@qwikest/icons/heroicons"
import { filesize } from "filesize"
import cx from "classnames"


type BannerType = "adobe" | "gwd"

interface Banner {
    type: BannerType
    name: string
    url: string
    size: string
}

const ALLOWED_MIME = [
    "application/x-zip-compressed",
    "application/zip",
    "multipart/x-zip",
    "application/vnd.rar",
    "application/x-rar-compressed",

]

export default component$(() => {
    const banners = useStore<Banner[]>([])
    const isDraging = useSignal(false)
    const chooseFileId = useId()

    const processFiles = $(async (files: File[]) => {
        await init()
        initialize()

        for (const file of files!) {
            try {
                const buffer = await readFileBuffer(file)
                const result = await parseFile(buffer)

                banners.unshift({
                    type: result.mode as BannerType,
                    url: result.url,
                    name: file.name,
                    size: filesize(file.size, { base: 2, standard: "jedec" }) as string
                })
            } catch (err) {
                console.log(err)
            }
        }
    })

    const onChange = $(async (_: QwikChangeEvent<HTMLInputElement>, el: HTMLInputElement) => {
        await processFiles(Array.from(el.files!))
    })

    const onDrop = $(async (e: QwikDragEvent<HTMLDivElement>) => {
        e.stopPropagation()
        isDraging.value = false

        const files: File[] = []

        for (const file of e.dataTransfer.files) {
            if (ALLOWED_MIME.includes(file.type)) {
                files.push(file)
            } else {
                console.log("Unsupported file", file.name, file.type)
            }
        }
        await processFiles(files)
    })

    const stopPropagation = $((e: QwikDragEvent<HTMLDivElement>,) => {
        e.stopPropagation()
    })

    const startDrag = $((e: QwikDragEvent<HTMLDivElement>) => {
        e.stopPropagation()
        isDraging.value = true
    })

    const stopDrag = $((e: QwikDragEvent<HTMLDivElement>) => {
        e.stopPropagation()
        isDraging.value = false
    })

    return (
        <div class="min-h-screen flex flex-col items-center bg-gray-100 pb-40">
            <h1 class="text-6xl my-40">Banner Viewer</h1>
            <div class="bg-white rounded-md p-5 w-full max-w-xl border border-gray-200">

                {/* Upload Cmp */}
                <form class={cx(
                    "w-full h-60 border-2 flex flex-col items-center justify-center rounded-md gap-5",
                    {
                        "border-dashed": !isDraging.value,
                        "border-blue-600 border-solid bg-blue-100": isDraging.value
                    }
                )}
                    preventdefault:submit
                    preventdefault:drag
                    preventdefault:dragstart
                    preventdefault:dragend
                    preventdefault:dragover
                    preventdefault:dragenter
                    preventdefault:dragleave
                    preventdefault:drop
                    onDrag$={stopPropagation}
                    onDragStart$={stopPropagation}
                    onDragEnd$={stopDrag}
                    onDragOver$={startDrag}
                    onDragEnter$={startDrag}
                    onDragLeave$={stopDrag}
                    onDrop$={onDrop}
                >
                    <div class="text-3xl text-gray-400">
                        <HiArrowUpTrayOutline />
                    </div>
                    <div>
                        Drag & Drop or <span>
                            <label for={chooseFileId} class="text-blue-700 hover:underline cursor-pointer">Choose file</label>
                            <input onChange$={onChange} type="file" multiple id={chooseFileId} accept=".zip,.rar" class="invisible w-0 h-0" />
                        </span> to upload
                    </div>
                    <div class="text-sm text-gray-400">ZIP, RAR</div>
                </form>

                {/* Links List */}
                {banners.length && (<div class="flex flex-col gap-3 mt-5">
                    {banners.map((file, i) => (
                        <a href={file.url} target="_blank" rel="noreferrer" class="bg-gray-100 p-3 rounded flex items-center gap-3 hover:bg-gray-200" key={i}>
                            <div class="px-1 text-4xl text-gray-600">
                                {file.type == "adobe" ? (<SiAdobe />) : (<SiGoogle />)}
                            </div>
                            <div class="flex-1 flex flex-col">
                                <div class="font-normal">{file.name}</div>
                                <div class="text-xs text-gray-500">{file.size}</div>
                            </div>
                            <div class="text-2xl">
                                <HiLinkOutline />
                            </div>
                        </a>
                    ))}
                </div>) || null}
            </div>
        </div>
    )
})