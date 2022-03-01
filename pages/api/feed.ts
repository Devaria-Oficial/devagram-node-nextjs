import type {NextApiRequest, NextApiResponse} from 'next';
import type {RespostaPadraoMsg} from '../../types/RespostaPadraoMsg';
import {validarTokenJWT} from '../../middlewares/validarTokenJWT';
import {conectarMongoDB} from '../../middlewares/conectarMongoDB';
import { UsuarioModel } from '../../models/UsuarioModel';
import { PublicacaoModel } from '../../models/PublicacaoModel';
import { SeguidorModel } from '../../models/SeguidorModel';
import { politicaCORS } from '../../middlewares/politicaCORS';

const feedEndpoint = async (req : NextApiRequest, res : NextApiResponse<RespostaPadraoMsg | any>) => {
    try{
        if(req.method === 'GET'){
            if(req?.query?.id){
                // agora q tenho o id do usuario
                // como eu valido se o usuario valido
                const usuario = await UsuarioModel.findById(req?.query?.id);
                if(!usuario){
                    return res.status(400).json({erro : 'Usuario nao encontrado'});
                }

                // e como eu busco as publicacoes dele?
                const publicacoes = await PublicacaoModel
                    .find({idUsuario : usuario._id})
                    .sort({data : -1});

                return res.status(200).json(publicacoes);
            }else{
                const {userId} = req.query;
                const usuarioLogado = await UsuarioModel.findById(userId);
                if(!usuarioLogado){
                    return res.status(400).json({erro : 'Usuario nao encontrado'});
                }

                const seguidores = await SeguidorModel.find({usuarioId : usuarioLogado._id});
                const seguidoresIds = seguidores.map(s => s.usuarioSeguidoId);

                const publicacoes = await PublicacaoModel.find({
                    $or : [
                        {idUsuario : usuarioLogado._id},
                        {idUsuario : seguidoresIds}
                    ]
                })
                .sort({data : -1});

                const result = [];
                for (const publicacao of publicacoes) {
                   const usuarioDaPublicacao = await UsuarioModel.findById(publicacao.idUsuario);
                   if(usuarioDaPublicacao){
                        const final = {...publicacao._doc, usuario : {
                            nome : usuarioDaPublicacao.nome,
                            avatar : usuarioDaPublicacao.avatar
                        }};
                        result.push(final);  
                   }
                }

                return res.status(200).json(result);
            }
        }
        return res.status(405).json({erro : 'Metodo informado nao e valido'});
    }catch(e){
        console.log(e);
    }
    return res.status(400).json({erro : 'Nao foi possivel obter o feed'});
}

export default politicaCORS(validarTokenJWT(conectarMongoDB(feedEndpoint)));