<?php
  class GetUserData extends Query{
    public function query($pdo, $args){
      $st = $pdo->prepare('
        select idUser from User
        where nick = ?
      ');
      $st->execute([$args->nick]);
      $id = $st->fetchColumn();

      if($id === false){
        $this->err('404');
        return;
      }

      $st = $pdo->prepare('
        select
          if(displayEmail = 1, email, null) as email,
          isMod,
          registrationDate,
          points,
          fullName,
          description
        from User
        where idUser = ?
      ');
      $st->execute([$id]);

      $this->succ($st->fetch());
    }
  }

  new GetUserData();
?>