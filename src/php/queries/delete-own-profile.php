<?php
  class DeleteOwnProfile extends Query{
    public function query($pdo, $args){
      $st = $pdo->prepare('
        select idUser
        from User where token = ?
      ');
      $st->execute([$args->token]);
      $id = $st->fetchColumn();

      if($id === false){
        $this->err('data');
        return;
      }

      $pdo->prepare('
        delete from User
        where idUser = ?
      ')->execute([$id]);
      $this->succ();
    }
  }

  new DeleteOwnProfile();
?>