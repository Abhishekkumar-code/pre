import { generateresponse, genratechattitle } from "../services/ai.service.js"
import uploadimage from "../services/Storage.service.js";
import chatmodel from "../model/chat.model.js"
import messagemodel from "../model/message.model.js"


export async function sendmessage(req, res) {
    console.log(req.file)
    const { message, chat: chatId  } = req.body;
    let title = null;
    let chat = null;
    let imageurl = null;

  if (req.file) {
      const uploaded = await uploadimage({
        buffer: req.file.buffer,
        filename: `chat_${Date.now()}_${req.file.originalname}`,
        folder: "/chat-images",
      });
      imageurl = uploaded.url;
    }

    if (!chatId) {

        title = await genratechattitle(message);
        title = title?.replace(/"/g, "").trim();
        chat = await chatmodel.create({
            user: req.user.id,
            title
        })
    } else {
        chat = await chatmodel.findById(chatId);
    }

    const usermessage = await messagemodel.create({
        chat: chat._id || chatId,
        content: message,
        imageurl: imageurl || null, 
        role: "user"
    })


    const messages = await messagemodel.find({ chat: chatId || chat._id })
    const result = await generateresponse(messages);

    const aimessage = await messagemodel.create({
        chat: chat._id || chatId,
        content: result,
        role: "ai"
    })

         console.log(messages);
 


    res.status(201).json({
        title,
        chat,
        aimessage,
        usermessage
    });
}
 

export async function  getchat(req,res){
const userid = req.user.id
const chats = await chatmodel.find({user:userid})

res.status(200).json({
    message:"chat recieved succesfully",
    chats
})
}


export async function getmessages(req,res){
    const {chatId }= req.params;
    const chat = await chatmodel.findOne({
        _id:chatId,
        user:req.user.id

    })

    if(!chat){

        return res.status(404).json({
            message:"chat not found "
        })
    }
  const messages = await messagemodel.find({
    chat:chatId
  })
  res.status(200).json({
    message:"Message recieved succefully",
    messages
  })
}


export async function deletechat(req,res){
    const {chatId} = req.params;
    
    const chat = await chatmodel.findOneAndDelete({
        _id:chatId,
        user:req.user.id
    })

    if(!chat){
        return res.status(404).json({
            message:"chat not found"
        })
    }

    await messagemodel.deleteMany({
        chat:chatId
    })

    res.status(200).json({
        message:"chat deleted successfully"
    })
}















// purana code
// export async function sendmessage(req, res) {
//     const { message, chat: chatId } = req.body

//     let title = null;
//     let chat = null;

//     if (!chatId) {
//         title = await generatechattitle(message);
//         chat = await chatmodel.create({
//             user: req.user.id,
//             title
//         })
//     } else {
//         chat = await chatmodel.findById(chatId);
//     }

//     const usermessage = await messagemodel.create({
//         chat: chat._id,
//         content: message,
//         role: "user"
//     })

//     const messages = await messagemodel.find({ chat: chat._id }).sort({ createdAt: 1 });
//     const result = await generateresponse(messages);

//     const aimessage = await messagemodel.create({
//         chat: chat._id,
//         content: result,
//         role: "ai"
//     })

//     res.json({ title, chat, aimessage });
// }
