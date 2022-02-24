import type {NextApiResponse} from 'next';
import type {RespostaPadraoMsg} from '../../types/RespostaPadraoMsg';
import nc from 'next-connect';
import {updload, uploadImagemCosmic} from '../../services/uploadImagemCosmic';
import {conectarMongoDB} from '../../middlewares/conectarMongoDB';
import {validarTokenJWT} from '../../middlewares/validarTokenJWT';
import {PublicacaoModel} from '../../models/PublicacaoModel';
import {UsuarioModel} from '../../models/UsuarioModel';

const handler = nc()
    .use(updload.single('file'))
    .post(async (req : any, res : NextApiResponse<RespostaPadraoMsg>) => {
        try{
            const {userId} = req.query;
            const usuario = await UsuarioModel.findById(userId);
            if(!usuario){
                return res.status(400).json({erro : 'Usuario nao encontrado'});
            }

            if(!req || !req.body){
                return res.status(400).json({erro : 'Parametros de entrada nao informados'});
            }
            const {descricao} = req?.body;

            if(!descricao || descricao.length < 2){
                return res.status(400).json({erro : 'Descricao nao e valida'});
            }
    
            if(!req.file || !req.file.originalname){
                return res.status(400).json({erro : 'Imagem e obrigatoria'});
            }

            const image = await uploadImagemCosmic(req);
            const publicacao = {
                idUsuario : usuario._id,
                descricao,
                foto : image.media.url,
                data : new Date()
            }

            usuario.publicacoes++;
            await UsuarioModel.findByIdAndUpdate({_id : usuario._id}, usuario);

            await PublicacaoModel.create(publicacao);
            return res.status(200).json({msg : 'Publicacao criada com sucesso'});
        }catch(e){
            console.log(e);
            return res.status(400).json({erro : 'Erro ao cadastrar publicacao'});
        }
});

export const config = {
    api : {
        bodyParser : false
    }
}

export default validarTokenJWT(conectarMongoDB(handler)); 