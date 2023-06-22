import express from "express";
import {PrismaClient} from "@prisma/client";

const port = 3000;
const app = express();
const prisma = new PrismaClient();

//GET , POST , PUT , PATCH, DELETE
app.get("/movies", async (_, res ) => {
  const movies = await prisma.movie.findMany({
    orderBy: {
      title: "asc",
    },
    include: {
      genres: true,
      languages: true
    }
  });
  res.json(movies);
});

app.post("/movies", async (req, res) => {

  const { title, genre_id, language_id, oscar_count, release_date} = req.body;

  try{
    // case insensitive - se a busca for feita por john wick ou John wick ou JOHN WiCK, o registro vai ser retornado na consulta

    // case sensitive - se buscar john wick e no banco estiver com John wick, não vai ser retornado na consulta

    const movieWithSameTitle = await prisma.movie.findFirst({
      where: { 
        title: {equals: title, mode: "insensitive"} 
      },
    });

    if(movieWithSameTitle) {
      return res.status(409)
        .send ({ message: "Já existe um filme cadastrado com esse título"});
    }

    await prisma.movie.create({
      data: {
        title,
        genre_id,
        language_id,
        oscar_count,
        release_date: new Date(release_date),
      },
    });
  }catch(error){
    return res.status(500).send({message:"Falha ao cadastrar um filme"});
  }
    
  res.status(201) .send();
});

app.put("/movies/:id", async (req, res) => {
  //pegar o id do resgistro que vai ser atualizado
  try{
  const id = Number(req.params.id);

    const movie = await prisma.movie.update({
      where: {
        id
      }
    });
    if(!movie){
      return res.status(404).send({ message: "filme não encontrado"});
    }
    const data = { ...req.body };
    data.release_date = data.release_date 
      ? new Date(data.release_date) : undefined;
    //pegar os dados do filme que sera atualizado e atualizar ele no prisma
    await prisma.movie.update({
      where: {
        id
      },
      data
    });
    
  }catch(error){
    return res.status(500).send({ message: "Falha ao atualizar o registro do filme"});
  }
  //retornar o status correto informando que o filme foi atualizado
  res.status(200).send(); 
});

app.delete("/movies/:id", async(req, res) => {
  const id = Number(req. params.id);

  try{

    const movie = await prisma.movie.findUnique ({ where: {id}});

    if(!movie){
      return res.status(404).send({ message: "O Filme não foi encontrado" });
    }

    await prisma.movie.delete({where: {id}});
  }catch(error){
    return res.status(500).send({message: "Não foi possível remover"});
  }

  res.status(200).send();

});

app.get("/movies/:genreName", async (req, res) => {

  try{
  const moviesFilteredByGenreName = await prisma.movie.findMany({
    include: {
      genre: true,
      languages:true
    },
    where: {
      genres: {
        name: {
          equals: req.params.genreName,
          mode:"insensitive"
        }
      }
    }
  });
  res.status(200).send(moviesFilteredByGenreName);
}catch(error){
  return res.status(500).send({message: Falha ao filtrar filmes por gênero});
}
});

app.listen(port, () => {
  console.log(`Servidor em execução na porta ${port}`);
});