<?php
  class Logout extends Query{
    public function query($pdo, $args){
      $st = $pdo->prepare('
        select idUser from User
        where token = ?
      ');
      $st->execute([$args->token]);
      $id = $st->fetchColumn();

      if($id === false){
        $this->err('invalidToken');
        return;
      }

      $id = (int)$id;
      $pdo->prepare('
        update User
        set token = null
        where idUser = ?
      ')->execute([$id]);

      $this->succ();
    }
  }

  new Logout();
?>