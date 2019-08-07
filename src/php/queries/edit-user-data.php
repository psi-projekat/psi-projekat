<?php
  class EditUserData extends Query{
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

      /*
        Directly injecting variable `$type` in this SQL script
        is completely safe, because Node.js server ensured
        that it's a valid column name
      */
      $type = $args->type;
      $pdo->prepare("
        update User
        set $type = ?
        where idUser = ?
      ")->execute([$args->val, $id]);
      $this->succ();
    }
  }

  new EditUserData();
?>