<?php
  class GetPosts extends Query{
    public function query($pdo, $args){
      $st = $pdo->prepare('
        select (
          select nick from User
          where idUser = postedBy
        ) as user, creationDate as date, content
        from Post
        where instr(content, ?) > 0
        order by creationDate desc
      ');
      $st->execute([$args->keywords]);
      $this->succ($st->fetchAll());
    }
  }

  new GetPosts();
?>