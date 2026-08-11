import multer from "multer"
const Storage = multer.memoryStorage()
const upload = multer({
    storage:Storage,
    limits:{
        fileSize:1024*1024*5
    }
})

export default upload;